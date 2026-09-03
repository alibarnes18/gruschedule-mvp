import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
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
        <p className="mb-2 text-xs uppercase tracking-[0.09em] text-muted-foreground">
          2025–2026 Bahar
        </p>
        <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[36px]">
          Akademik Takvim
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Dönem başlangıcı, kayıt haftaları, tatiller ve diğer akademik takvim
          etkinlikleri; geçmiş kayıtlar soluk gösterilir.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState>Akademik takvim etkinliği bulunamadı.</EmptyState>
      ) : (
        <div className="relative pl-8">
          <div className="absolute bottom-1.5 left-[9px] top-1.5 w-0.5 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,.06),#7C3AED_32%,#3B82F6_68%,rgba(255,255,255,.05))]" />
          <div className="flex flex-col gap-3.5">
            {events.map((event) => {
              const end = event.end_date ?? event.start_date;
              const isPast = end < today;
              const isOngoing = event.start_date <= today && today <= end;
              const category = categorizeCalendarEvent(event.title);

              return (
                <div key={event.id} className="relative" style={{ opacity: isPast ? 0.42 : 1 }}>
                  <div
                    className={
                      isOngoing
                        ? "absolute -left-[33px] top-[22px] size-3 rounded-full bg-[linear-gradient(135deg,#7C3AED,#3B82F6)] shadow-[0_0_0_4px_rgba(124,58,237,0.16),0_0_18px_rgba(124,58,237,0.85)]"
                        : isPast
                          ? "absolute -left-[33px] top-[22px] size-3 rounded-full bg-[#3A3A44]"
                          : "absolute -left-[33px] top-[22px] size-3 rounded-full border-2 border-[#4B4B58] bg-[#1A1A20]"
                    }
                  />
                  <div
                    className={`gs-card flex flex-col gap-2 p-4.5 sm:flex-row sm:items-start sm:justify-between ${isOngoing ? "border-[rgba(139,92,246,0.3)] shadow-[0_0_44px_-20px_rgba(124,58,237,0.9)]" : ""}`}
                  >
                    <div>
                      <p className="flex flex-wrap items-center gap-2.5 text-[16px] font-semibold tracking-tight text-foreground">
                        {event.title}
                        {isOngoing ? (
                          <span className="whitespace-nowrap rounded-full border border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.15)] px-2.5 py-0.5 text-[11px] font-semibold text-[#C4B5FD]">
                            Devam ediyor
                          </span>
                        ) : category ? (
                          <span className="whitespace-nowrap rounded-full border border-border bg-foreground/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {category}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 text-[13px] text-muted-foreground">
                        {formatDate(event.start_date)}
                        {event.end_date && event.end_date !== event.start_date
                          ? ` – ${formatDate(event.end_date)}`
                          : ""}
                      </p>
                      {event.description ? (
                        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/80">
                          {event.description}
                        </p>
                      ) : null}
                    </div>
                    <AddToCalendarButton
                      filename={`${event.title}.ics`}
                      event={calendarEventToIcsEvent(event)}
                      iconOnly
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
