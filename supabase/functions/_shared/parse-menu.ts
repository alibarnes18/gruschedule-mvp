// Giresun's monthly yemekhane menu PDF is a 5-weekday x N-week grid, one
// cell per day: a date+weekday header, then çorba/ana yemek/yardımcı/ek
// dish-name lines, plus a per-day calorie total we don't persist
// (menu_days has no column for it, so calorie/"KKAL" tokens are just
// filtered out rather than parsed).
//
// Validated against fixtures/menu/eylul-2026.pdf (22 days, 1 flagged —
// the source PDF itself prints "29.09.2025 - Salı" instead of
// "29.09.2026", caught by cross-checking the date against the weekday
// name printed right next to it).

export interface TextItem {
  str: string;
  x: number;
  y: number;
}

export interface MenuGridConfig {
  /** x-position of each weekday column (Pazartesi..Cuma), in page order. */
  columnX: number[];
}

export interface ParsedMenuDay {
  date: string; // YYYY-MM-DD, as printed — not corrected even if flagged
  items: string[];
  flags: string[];
}

const DATE_HEADER_RE = /^(\d{2})\.(\d{2})\.(\d{4})\s*[-–]\s*(\p{L}+)/u;
const EXCLUDE_EXACT = new Set(["Enerji", "KKAL", "/"]);
const CALORIE_RE = /^\d+\/?$/;

const WEEKDAY_INDEX: Record<string, number> = {
  "Pazar": 0,
  "Pazartesi": 1,
  "Salı": 2,
  "Çarşamba": 3,
  "Perşembe": 4,
  "Cuma": 5,
  "Cumartesi": 6,
};

function nearest(candidates: number[], value: number): number {
  return candidates.reduce((best, c) => Math.abs(c - value) < Math.abs(best - value) ? c : best);
}

export function parseMenu(rawItems: TextItem[], config: MenuGridConfig): ParsedMenuDay[] {
  const items = rawItems.filter((i) => i.str.trim() !== "");

  const headers = items.filter((i) => DATE_HEADER_RE.test(i.str.trim()));

  const bandTopYs = [...new Set(headers.map((h) => h.y))].sort((a, b) => b - a);

  // The last row of the grid has no following band to bound its bottom, so
  // without a limit it swallows the page's footer (signature block) printed
  // below it. Bound it by the largest gap seen between this document's own
  // bands — generous enough to keep a full day's dishes, tight enough to
  // drop the footer sitting further down the page.
  const bandGaps = bandTopYs.slice(0, -1).map((y, i) => y - bandTopYs[i + 1]);
  const lastBandHeight = bandGaps.length > 0 ? Math.max(...bandGaps) : Infinity;

  const bands = bandTopYs.map((y, i) => ({
    top: y + 5,
    bottom: i + 1 < bandTopYs.length ? bandTopYs[i + 1] : y - lastBandHeight,
  }));

  const days: ParsedMenuDay[] = [];

  for (const band of bands) {
    const bandHeaders = headers.filter((h) => h.y <= band.top && h.y > band.bottom);

    for (const header of bandHeaders) {
      const m = header.str.trim().match(DATE_HEADER_RE)!;
      const [, dd, mm, yyyy, weekdayName] = m;
      const date = `${yyyy}-${mm}-${dd}`;

      const flags: string[] = [];
      const expectedWeekday = WEEKDAY_INDEX[weekdayName];
      const actualWeekday = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd))).getUTCDay();
      if (expectedWeekday === undefined) {
        flags.push("unknown_weekday_name");
      } else if (actualWeekday !== expectedWeekday) {
        // The source PDF's date and weekday-name disagree — a data-entry
        // typo in the university's own file (seen in practice: a year
        // printed as 2025 mid-way through an otherwise-2026 month).
        flags.push("weekday_mismatch");
      }

      const headerColumnX = nearest(config.columnX, header.x);
      const dishItems = items
        .filter((i) =>
          i.y <= band.top && i.y > band.bottom &&
          !EXCLUDE_EXACT.has(i.str.trim()) && !CALORIE_RE.test(i.str.trim()) &&
          !DATE_HEADER_RE.test(i.str.trim()) &&
          nearest(config.columnX, i.x) === headerColumnX
        )
        .sort((a, b) => b.y - a.y);

      if (dishItems.length === 0) flags.push("no_items");

      days.push({ date, items: dishItems.map((i) => i.str.trim()), flags });
    }
  }

  return days;
}
