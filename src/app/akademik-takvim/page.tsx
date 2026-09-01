import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { Badge } from "@/components/ui/badge";
import { getAcademicCalendarEvents } from "@/lib/data";
import { calendarEventToIcsEvent, formatDate, toIsoDate } from "@/lib/schedule";

export const metadata = {
  title: "Akademik Takvim — Gruschedule",
};

export default async function AcademicCalendarPage() {
  const events = await getAcademicCalendarEvents();
  const today = toIsoDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Akademik Takvim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dönem başlangıcı, kayıt haftaları, tatiller ve diğer akademik takvim
          etkinlikleri.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState>Akademik takvim etkinliği bulunamadı.</EmptyState>
      ) : (
        <ol className="relative border-s border-border pl-6">
          {events.map((event) => {
            const end = event.end_date ?? event.start_date;
            const isPast = end < today;
            const isOngoing = event.start_date <= today && today <= end;

            return (
              <li key={event.id} className="mb-6 last:mb-0">
                <span
                  className={`absolute -start-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                    isOngoing
                      ? "bg-emerald-500"
                      : isPast
                        ? "bg-muted-foreground/40"
                        : "bg-muted-foreground"
                  }`}
                />
                <p
                  className={`flex items-center gap-2 text-sm font-medium ${
                    isPast ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {event.title}
                  {isOngoing ? (
                    <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                      Devam ediyor
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.start_date)}
                  {event.end_date && event.end_date !== event.start_date
                    ? ` – ${formatDate(event.end_date)}`
                    : ""}
                </p>
                {event.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
                <div className="mt-2">
                  <AddToCalendarButton
                    filename={`${event.title}.ics`}
                    event={calendarEventToIcsEvent(event)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
