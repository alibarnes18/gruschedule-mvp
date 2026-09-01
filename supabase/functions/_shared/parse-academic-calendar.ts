// Giresun's academic calendar PDF is a genuine two-column table (date,
// description) — the simple "Seçenek A" case gruschedule.md section 2
// expected, unlike the grid-format class/exam schedules. Still uses
// coordinates (not linear text order) because wrapped descriptions and
// the mid-table "GÜZ YARIYILI"/"BAHAR YARIYILI" divider rows need
// position, not just stream order, to attribute correctly.
//
// Validated against
// fixtures/academic-calendar/2026-2027-onlisans-lisans.pdf (91 events).

export interface TextItem {
  str: string;
  x: number;
  y: number;
}

export interface AcademicCalendarConfig {
  /** Date-anchor items (e.g. "07-09 Eylül 2026") sit left of this. */
  dateColumnXMax: number;
  /** Description items sit right of this. */
  descriptionXMin: number;
}

export interface ParsedCalendarEvent {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  flags: string[];
}

const TERM_DIVIDERS = new Set(["GÜZ YARIYILI", "BAHAR YARIYILI"]);

const MONTHS: Record<string, string> = {
  "ocak": "01",
  "şubat": "02",
  "mart": "03",
  "nisan": "04",
  "mayıs": "05",
  "haziran": "06",
  "temmuz": "07",
  "ağustos": "08",
  "eylül": "09",
  "ekim": "10",
  "kasım": "11",
  "aralık": "12",
};

const CROSS_MONTH_RANGE_RE = /^(\d{1,2})\s+(\p{L}+)-(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u;
const SAME_MONTH_RANGE_RE = /^(\d{1,2})-(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u;
const SINGLE_DATE_RE = /^(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u;

function isoDate(day: string, monthName: string, year: string): string | null {
  const month = MONTHS[monthName.toLocaleLowerCase("tr")];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/** Parses a date-anchor string into {start,end}, or null if it doesn't
 * match any of the three date formats this document uses. */
function parseDateAnchor(raw: string): { start: string; end: string | null } | null {
  const cross = raw.match(CROSS_MONTH_RANGE_RE);
  if (cross) {
    const [, startDay, startMonth, endDay, endMonth, year] = cross;
    const start = isoDate(startDay, startMonth, year);
    const end = isoDate(endDay, endMonth, year);
    if (start && end) return { start, end };
  }

  const sameMonth = raw.match(SAME_MONTH_RANGE_RE);
  if (sameMonth) {
    const [, startDay, endDay, month, year] = sameMonth;
    const start = isoDate(startDay, month, year);
    const end = isoDate(endDay, month, year);
    if (start && end) return { start, end };
  }

  const single = raw.match(SINGLE_DATE_RE);
  if (single) {
    const [, day, month, year] = single;
    const start = isoDate(day, month, year);
    if (start) return { start, end: null };
  }

  return null;
}

export function parseAcademicCalendar(
  rawItems: TextItem[],
  config: AcademicCalendarConfig,
): ParsedCalendarEvent[] {
  const items = rawItems.filter((i) => i.str.trim() !== "");

  const dateAnchors = items
    .map((i, idx) => ({ ...i, idx }))
    .filter((i) =>
      i.x < config.dateColumnXMax && !TERM_DIVIDERS.has(i.str.trim()) &&
      parseDateAnchor(i.str.trim()) !== null
    )
    .sort((a, b) => b.y - a.y);

  if (dateAnchors.length === 0) return [];

  // Title block sits above the first row, footnotes sit below the last —
  // restricting to this y-range excludes both without needing to name them.
  const tableTop = dateAnchors[0].y + 5;
  const tableBottom = dateAnchors[dateAnchors.length - 1].y - 5;

  const descriptionItems = items.filter((i) =>
    i.x >= config.descriptionXMin && i.y <= tableTop && i.y > tableBottom &&
    !TERM_DIVIDERS.has(i.str.trim())
  );

  // A multi-line description's first line can start slightly *above* its
  // own row's date anchor (the row grows to fit the wrap, the date sits
  // at the row's single-line baseline) — a strict y-window between
  // consecutive anchors then misattributes that first line to the row
  // above. Assign each description line to its nearest anchor by |Δy|
  // instead, same fix as the room-assignment logic in the schedule parsers.
  const linesByAnchor = new Map<number, TextItem[]>();
  for (const line of descriptionItems) {
    const nearest = dateAnchors
      .map((an) => ({ an, d: Math.abs(an.y - line.y) }))
      .sort((a, b) => a.d - b.d)[0];
    const list = linesByAnchor.get(nearest.an.idx) ?? [];
    list.push(line);
    linesByAnchor.set(nearest.an.idx, list);
  }

  const events: ParsedCalendarEvent[] = [];

  for (const anchor of dateAnchors) {
    const lines = (linesByAnchor.get(anchor.idx) ?? [])
      .sort((a, b) => b.y - a.y)
      .map((i) => i.str.trim().replace(/^\*+/, ""));

    const parsed = parseDateAnchor(anchor.str.trim())!;
    const flags: string[] = [];
    if (lines.length === 0) flags.push("no_description");

    events.push({
      title: lines.join(" "),
      startDate: parsed.start,
      endDate: parsed.end,
      flags,
    });
  }

  return events;
}
