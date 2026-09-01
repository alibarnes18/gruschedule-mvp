export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
} & (
  | { allDay: true; startDate: string; endDate?: string } // YYYY-MM-DD, endDate inclusive
  | { allDay: false; start: Date; end: Date }
);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(dateStr: string): string {
  return dateStr.replaceAll("-", "");
}

function addOneDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function toIcsDateTime(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
    .replaceAll("\n", "\\n");
}

function eventToVevent(event: IcsEvent, dtstamp: string): string {
  const lines = ["BEGIN:VEVENT", `UID:${event.uid}`, `DTSTAMP:${dtstamp}`];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(event.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${addOneDay(event.endDate ?? event.startDate)}`);
  } else {
    lines.push(`DTSTART:${toIcsDateTime(event.start)}`);
    lines.push(`DTEND:${toIcsDateTime(event.end)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.summary)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function buildIcsCalendar(events: IcsEvent[]): string {
  const dtstamp = toIcsDateTime(new Date()) + "Z";
  const body = events.map((e) => eventToVevent(e, dtstamp)).join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gruschedule//tr",
    "CALSCALE:GREGORIAN",
    body,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, events: IcsEvent[]): void {
  const content = buildIcsCalendar(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
