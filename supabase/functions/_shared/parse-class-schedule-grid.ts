// Reconstructs a weekly class-schedule grid (day-blocks x class-year
// columns x hour-rows) from the positioned text items pdfjs-dist returns
// for a page. Plain linear text extraction does not preserve the visual
// grid order for this PDF format (see gruschedule.md section 2), so this
// works from x/y coordinates instead.
//
// Validated against fixtures/class-schedule/bilgisayar-muhendisligi-2026-2027-guz.pdf
// (47 entries, 7 flagged — see parse-class-schedule-grid.test.ts).

export interface TextItem {
  str: string;
  x: number;
  y: number;
}

export interface GridColumnConfig {
  gradeLevel: number;
  /** Inclusive left edge of this class-year's whole column (text + room). */
  xMin: number;
  /** Exclusive right edge of this class-year's whole column. */
  xMax: number;
  /** x boundary between the course-text zone and the room ("YER") zone. */
  split: number;
}

export interface ClassScheduleGridConfig {
  columns: GridColumnConfig[];
  /** day_of_week values (1=Pazartesi..7=Pazar) for each day-block, top to bottom. */
  dayOrder: number[];
}

export interface ParsedClassScheduleEntry {
  dayOfWeek: number;
  gradeLevel: number;
  sectionLabel: string | null;
  courseCode: string;
  courseName: string;
  instructor: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  /** Non-empty when the entry needs a human to double check it. */
  flags: string[];
}

const DAY_BAND_MARKER = "GÜN";
const HEADER_SKIP = new Set(["GÜN", "SAAT", "YER"]);
const SINIF_HEADER_RE = /^\d\.\s?SINIF$/;

const CODE_RE = /^[A-ZÇĞİÖŞÜ]{2,6}\s*-\s*\d{0,3}$/;
// Some source PDFs omit the trailing number for a course code (a data
// quality issue in the university's own PDF, e.g. "BİLM-" alone) — still
// treat it as an anchor so we don't silently drop that grid cell.
const MALFORMED_CODE_RE = /^[A-ZÇĞİÖŞÜ]{2,6}\s*-$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const RANGE_RE = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/;
const INSTRUCTOR_RE = /^(Prof\.|Doç\.|Dr\.|Arş\.|Öğr\.|Okutman|Öğretim)/i;
const SUBE_RE = /\(([AB]) Şubesi\)/;

/** A Turkish surname sometimes wraps onto its own line right after the
 * instructor line (column too narrow for "Title Firstname SURNAME").
 * Such a line is short, has no lowercase letters, and isn't itself a
 * code/tag/time-range. */
function isBareSurnameContinuation(s: string): boolean {
  return (
    s.length > 1 &&
    s.length < 25 &&
    s === s.toUpperCase() &&
    !CODE_RE.test(s) &&
    !SUBE_RE.test(s) &&
    !RANGE_RE.test(s)
  );
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseClassScheduleGrid(
  rawItems: TextItem[],
  config: ClassScheduleGridConfig,
): ParsedClassScheduleEntry[] {
  const items = rawItems.filter((i) => i.str.trim() !== "");

  const bandTopYs = items
    .filter((i) => i.str.trim() === DAY_BAND_MARKER)
    .map((i) => i.y)
    .sort((a, b) => b - a);

  if (bandTopYs.length !== config.dayOrder.length) {
    throw new Error(
      `expected ${config.dayOrder.length} day-blocks (marker "${DAY_BAND_MARKER}"), found ${bandTopYs.length}`,
    );
  }

  const bands = bandTopYs.map((y, i) => ({
    dayOfWeek: config.dayOrder[i],
    top: y + 5,
    bottom: i + 1 < bandTopYs.length ? bandTopYs[i + 1] : -Infinity,
  }));

  const entries: ParsedClassScheduleEntry[] = [];

  for (const band of bands) {
    const timeRows = items
      .filter((i) => TIME_RE.test(i.str.trim()) && i.y <= band.top && i.y > band.bottom)
      .map((i) => ({ y: i.y, time: i.str.trim() }))
      .sort((a, b) => b.y - a.y);

    const nearestRow = (y: number): string | undefined => {
      let best = timeRows[0];
      for (const r of timeRows) {
        if (Math.abs(r.y - y) < Math.abs(best.y - y)) best = r;
      }
      return best?.time;
    };

    for (const col of config.columns) {
      const colItems = items
        .filter((i) =>
          i.y <= band.top && i.y > band.bottom &&
          i.x >= col.xMin && i.x < col.xMax &&
          !TIME_RE.test(i.str.trim()) &&
          !HEADER_SKIP.has(i.str.trim()) &&
          !SINIF_HEADER_RE.test(i.str.trim())
        )
        .sort((a, b) => b.y - a.y);

      const textItems = colItems.filter((i) => i.x < col.split);
      const roomItems = colItems.filter((i) => i.x >= col.split);

      const anchors = textItems
        .map((i, idx) => ({ ...i, idx }))
        .filter((i) => CODE_RE.test(i.str.trim()) || MALFORMED_CODE_RE.test(i.str.trim()));

      // Assign each room item to its nearest anchor by |Δy| rather than by
      // window-slicing: two simultaneous elective alternatives in the same
      // cell can print their shared room label at a y roughly between both
      // anchors, which window-slicing would attribute to only one of them.
      const roomAssignments = new Map<number, string[]>();
      for (const room of roomItems) {
        const nearest = anchors
          .map((an) => ({ an, d: Math.abs(an.y - room.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (!nearest) continue;
        const list = roomAssignments.get(nearest.an.idx) ?? [];
        list.push(room.str.trim());
        roomAssignments.set(nearest.an.idx, list);
      }

      for (let a = 0; a < anchors.length; a++) {
        const anchor = anchors[a];
        const yTop = anchor.y;
        const yBottom = a + 1 < anchors.length ? anchors[a + 1].y : band.bottom;
        const slice = textItems.filter((i) => i.y <= yTop && i.y > yBottom);

        const code = anchor.str.trim();
        const flags: string[] = [];
        if (!CODE_RE.test(code)) flags.push("malformed_code");

        let instructor: string | null = null;
        let sectionLabel: string | null = null;
        let explicitRange: { start: string; end: string } | null = null;
        const nameParts: string[] = [];

        for (const it of slice) {
          // `anchor` is a spread copy ({...i, idx}), not the same object
          // reference as its counterpart in `slice` — compare by content
          // instead of `it === anchor`, or the anchor's own line gets
          // reprocessed as if it were a separate row (duplicating the code
          // into course_name).
          if (it.y === anchor.y && it.str === anchor.str) continue;
          const s = it.str.trim();
          const rangeMatch = s.match(RANGE_RE);
          if (rangeMatch) {
            explicitRange = { start: rangeMatch[1], end: rangeMatch[2] };
            continue;
          }
          const subeMatch = s.match(SUBE_RE);
          if (subeMatch) sectionLabel = subeMatch[1];
          if (INSTRUCTOR_RE.test(s) && !instructor) {
            instructor = s;
            continue;
          }
          if (instructor && isBareSurnameContinuation(s)) {
            instructor += " " + s;
            continue;
          }
          nameParts.push(s);
        }

        const rooms = [...new Set(roomAssignments.get(anchor.idx) ?? [])];
        if (rooms.length === 0) flags.push("no_room");
        if (!instructor) flags.push("no_instructor");

        const startTime = explicitRange?.start ?? nearestRow(yTop);
        let endTime = explicitRange?.end;
        if (!startTime) {
          flags.push("no_start_time");
        } else if (!endTime) {
          endTime = addHour(startTime);
        }

        entries.push({
          dayOfWeek: band.dayOfWeek,
          gradeLevel: col.gradeLevel,
          sectionLabel,
          courseCode: code,
          courseName: nameParts.join(" "),
          instructor,
          startTime: startTime ?? "",
          endTime: endTime ?? "",
          location: rooms.length > 0 ? rooms.join(" / ") : null,
          flags,
        });
      }
    }
  }

  return entries;
}
