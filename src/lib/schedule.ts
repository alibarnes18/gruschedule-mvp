import type { IcsEvent } from "@/lib/ics";

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

const DEFAULT_EXAM_DURATION_MINUTES = 90;

export function examToIcsEvent(
  exam: { id: string; course_name: string; exam_type: string; exam_date: string; exam_time: string | null; location: string | null },
  departmentName?: string,
): IcsEvent {
  const summary = `${EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}: ${exam.course_name}`;
  const description = departmentName ? `Bölüm: ${departmentName}` : undefined;

  if (!exam.exam_time) {
    return {
      uid: `exam-${exam.id}@gruschedule`,
      summary,
      description,
      location: exam.location ?? undefined,
      allDay: true,
      startDate: exam.exam_date,
    };
  }

  const start = new Date(`${exam.exam_date}T${exam.exam_time}`);
  const end = new Date(start.getTime() + DEFAULT_EXAM_DURATION_MINUTES * 60_000);
  return {
    uid: `exam-${exam.id}@gruschedule`,
    summary,
    description,
    location: exam.location ?? undefined,
    allDay: false,
    start,
    end,
  };
}

// Keyword-based, in priority order: the calendar data has no explicit
// category field, only a free-text title, so this is a best-effort guess
// rather than a guarantee — a title that doesn't match any keyword just
// gets no badge.
const CALENDAR_CATEGORY_KEYWORDS: { label: string; keywords: string[] }[] = [
  { label: "Bütünleme", keywords: ["bütünleme"] },
  { label: "Final Dönemi", keywords: ["final", "yarıyıl sonu sınav"] },
  { label: "Ara Sınav", keywords: ["ara sınav", "vize"] },
  { label: "Kayıt Haftası", keywords: ["kayıt yenileme", "kayıt haftası"] },
  { label: "Tatil", keywords: ["tatil"] },
  { label: "Sınav", keywords: ["sınav"] },
];

export function categorizeCalendarEvent(title: string): string | null {
  const normalized = title.toLocaleLowerCase("tr");
  const match = CALENDAR_CATEGORY_KEYWORDS.find(({ keywords }) =>
    keywords.some((k) => normalized.includes(k)),
  );
  return match?.label ?? null;
}

export function calendarEventToIcsEvent(event: {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}): IcsEvent {
  return {
    uid: `calendar-${event.id}@gruschedule`,
    summary: event.title,
    description: event.description ?? undefined,
    allDay: true,
    startDate: event.start_date,
    endDate: event.end_date ?? undefined,
  };
}
