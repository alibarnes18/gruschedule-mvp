import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAcademicCalendarEvents } from "@/lib/data";
import { calendarEventToIcsEvent, categorizeCalendarEvent, formatDate, toIsoDate } from "@/lib/schedule";

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
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const end = event.end_date ?? event.start_date;
            const isPast = end < today;
            const isOngoing = event.start_date <= today && today <= end;
            const category = categorizeCalendarEvent(event.title);

            return (
              <Card key={event.id} className={isPast ? "opacity-60" : undefined}>
                <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {event.title}
                      {isOngoing ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                          Devam ediyor
                        </Badge>
                      ) : null}
                      {category ? <Badge variant="outline">{category}</Badge> : null}
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
                  </div>
                  <AddToCalendarButton
                    filename={`${event.title}.ics`}
                    event={calendarEventToIcsEvent(event)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
