// Small formatting helpers duplicated from src/lib/schedule.ts — that
// module is bundled by Next.js via a TS path alias Deno can't resolve, so
// this Edge Function side keeps its own copy rather than sharing one.

export const DAY_NAMES: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};

export const EXAM_TYPE_LABELS: Record<string, string> = {
  midterm: "Vize",
  final: "Final",
  makeup: "Bütünleme",
};

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function sectionLabel(gradeLevel: number, label: string | null): string {
  const grade = `${gradeLevel}. Sınıf`;
  return label ? `${grade} - ${label} Şubesi` : grade;
}

/** A Date whose getDay()/getHours()/etc reflect Turkey wall-clock time,
 * regardless of which timezone the function is actually running in. */
export function nowInIstanbul(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`);
}

export function currentDbDay(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function currentTimeString(date: Date): string {
  return date.toTimeString().slice(0, 8);
}
