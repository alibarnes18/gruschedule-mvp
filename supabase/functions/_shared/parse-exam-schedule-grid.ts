// Reconstructs an exam-schedule grid (day-blocks x class-year columns x
// hour-rows) from positioned text items, the same coordinate-based
// approach as parse-class-schedule-grid.ts. The two document types share
// the underlying PDF template (day-blocks marked by a "GÜN" header row,
// hour-row labels, YER/room sub-columns) but differ enough in cell
// content — course code and name share one text line here, cells carry a
// "(NN)" enrolled-student-count line, and each day-block header embeds
// the actual calendar date — that this is a separate module rather than
// a shared abstraction over both.
//
// Validated against
// fixtures/exam-schedule/bilgisayar-muhendisligi-2025-2026-bahar-final.pdf
// (30 entries across 2 pages, 1 flagged — see parse-exam-schedule-grid.test.ts).

export interface TextItem {
  str: string;
  x: number;
  y: number;
}

export interface ExamGridColumnConfig {
  gradeLevel: number;
  xMin: number;
  xMax: number;
  split: number;
}

export interface ExamScheduleGridConfig {
  columns: ExamGridColumnConfig[];
  /** x-range of the vertical "(DD.MM.YYYY)" date column printed alongside
   * each day-block's rotated day-name label. */
  dateColumnX: { min: number; max: number };
}

export interface ParsedExamEntry {
  examDate: string; // YYYY-MM-DD
  gradeLevel: number;
  courseCode: string;
  courseName: string;
  instructor: string | null;
  examTime: string;
  location: string | null;
  /** Enrolled student count from the "(NN)" cell line — not currently
   * persisted (exam_events has no column for it), kept in case it's
   * useful later (e.g. room-capacity sanity checks). */
  studentCount: string | null;
  flags: string[];
}

const DAY_BAND_MARKER = "GÜN";
const HEADER_SKIP = new Set(["GÜN", "SAAT", "YER"]);
const GRADE_HEADER_RE = /^BİL\. MÜH\. \d$/;

const TIME_RE = /^\d{2}:\d{2}$/;
const COUNT_RE = /^\(\d+\)$/;
const CODE_LINE_RE = /^([A-ZÇĞİÖŞÜ]{2,6}\s*-\s*\d{1,3})\s*(.*)$/;
const INSTRUCTOR_RE = /^(Prof\.|Doç\.|Dr\.|Arş\.|Öğr\.|Okutman|Öğretim|Bil\. Müh\.)/i;
const DATE_RE = /(\d{2})\.(\d{2})\.(\d{4})/;

function isBareSurnameContinuation(s: string): boolean {
  return (
    s.length > 1 && s.length < 25 && s === s.toUpperCase() &&
    !CODE_LINE_RE.test(s) && !COUNT_RE.test(s)
  );
}

/** Parses every page of an exam-schedule PDF; pages beyond the first are
 * just later exam weeks using the same per-page day-block layout. */
export function parseExamScheduleGrid(
  pagesOfItems: TextItem[][],
  config: ExamScheduleGridConfig,
): ParsedExamEntry[] {
  const entries: ParsedExamEntry[] = [];
  for (const rawItems of pagesOfItems) {
    entries.push(...parseExamSchedulePage(rawItems, config));
  }
  return entries;
}

function parseExamSchedulePage(
  rawItems: TextItem[],
  config: ExamScheduleGridConfig,
): ParsedExamEntry[] {
  const items = rawItems.filter((i) => i.str.trim() !== "");

  const bandTopYs = items
    .filter((i) => i.str.trim() === DAY_BAND_MARKER)
    .map((i) => i.y)
    .sort((a, b) => b - a);

  const bands = bandTopYs.map((y, i) => ({
    top: y + 5,
    bottom: i + 1 < bandTopYs.length ? bandTopYs[i + 1] : -Infinity,
  }));

  const entries: ParsedExamEntry[] = [];

  for (const band of bands) {
    const dateChars = items
      .filter((i) =>
        i.x >= config.dateColumnX.min && i.x <= config.dateColumnX.max &&
        i.y <= band.top && i.y > band.bottom
      )
      .sort((a, b) => b.y - a.y)
      .map((i) => i.str.trim())
      .join("");
    const dateMatch = dateChars.match(DATE_RE);
    const examDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : null;

    const timeRows = items
      .filter((i) => TIME_RE.test(i.str.trim()) && i.y <= band.top && i.y > band.bottom)
      .map((i) => ({ y: i.y, time: i.str.trim() }))
      .sort((a, b) => b.y - a.y);
    const nearestRow = (y: number): string | undefined => {
      let best = timeRows[0];
      for (const r of timeRows) if (Math.abs(r.y - y) < Math.abs(best.y - y)) best = r;
      return best?.time;
    };

    for (const col of config.columns) {
      const colItems = items
        .filter((i) =>
          i.y <= band.top && i.y > band.bottom && i.x >= col.xMin && i.x < col.xMax &&
          !TIME_RE.test(i.str.trim()) && !HEADER_SKIP.has(i.str.trim()) &&
          !GRADE_HEADER_RE.test(i.str.trim())
        )
        .sort((a, b) => b.y - a.y);

      const textItems = colItems.filter((i) => i.x < col.split);
      const roomItems = colItems.filter((i) => i.x >= col.split);

      const anchors = textItems
        .map((i, idx) => ({ ...i, idx }))
        .filter((i) => CODE_LINE_RE.test(i.str.trim()));

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

        const codeMatch = anchor.str.trim().match(CODE_LINE_RE)!;
        const code = codeMatch[1].trim();
        const flags: string[] = [];

        let instructor: string | null = null;
        let studentCount: string | null = null;
        const nameParts: string[] = codeMatch[2].trim() ? [codeMatch[2].trim()] : [];

        for (const it of slice) {
          // `anchor` is a spread copy, not the same object reference as
          // its counterpart in `slice` — compare by content.
          if (it.y === anchor.y && it.str === anchor.str) continue;
          const s = it.str.trim();
          if (COUNT_RE.test(s)) {
            studentCount = s.slice(1, -1);
            continue;
          }
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
        if (!examDate) flags.push("no_date");

        entries.push({
          examDate: examDate ?? "",
          gradeLevel: col.gradeLevel,
          courseCode: code,
          courseName: nameParts.join(" "),
          instructor,
          examTime: nearestRow(yTop) ?? "",
          location: rooms.length > 0 ? rooms.join(" / ") : null,
          studentCount,
          flags,
        });
      }
    }
  }

  return entries;
}
