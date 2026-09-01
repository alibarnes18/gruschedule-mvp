export const DAY_NAMES: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5] as const;

export const EXAM_TYPE_LABELS: Record<string, string> = {
  midterm: "Vize",
  final: "Final",
  makeup: "Bütünleme",
};

export function currentDbDay(date: Date = new Date()): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function currentTimeString(date: Date = new Date()): string {
  return date.toTimeString().slice(0, 8);
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export function sectionLabel(gradeLevel: number, label: string | null): string {
  const grade = `${gradeLevel}. Sınıf`;
  return label ? `${grade} - ${label} Şubesi` : grade;
}

export function startOfWeek(date: Date = new Date()): Date {
  const day = currentDbDay(date);
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (day - 1));
  return result;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
