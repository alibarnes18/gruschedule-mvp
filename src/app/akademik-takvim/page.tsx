import { EmptyState } from "@/components/empty-state";
import { getAcademicCalendarEvents } from "@/lib/data";
import { formatDate, toIsoDate } from "@/lib/schedule";

export const metadata = {
  title: "Akademik Takvim — Gruschedule",
};

export default async function AcademicCalendarPage() {
  const events = await getAcademicCalendarEvents();
  const today = toIsoDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Akademik Takvim</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Dönem başlangıcı, kayıt haftaları, tatiller ve diğer akademik takvim
          etkinlikleri.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState>Akademik takvim etkinliği bulunamadı.</EmptyState>
      ) : (
        <ol className="relative border-s border-zinc-800 pl-6">
          {events.map((event) => {
            const end = event.end_date ?? event.start_date;
            const isPast = end < today;
            const isOngoing = event.start_date <= today && today <= end;

            return (
              <li key={event.id} className="mb-6 last:mb-0">
                <span
                  className={`absolute -start-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                    isOngoing
                      ? "bg-emerald-400"
                      : isPast
                        ? "bg-zinc-700"
                        : "bg-zinc-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isPast ? "text-zinc-500" : "text-zinc-100"
                  }`}
                >
                  {event.title}
                  {isOngoing ? (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-normal text-emerald-300">
                      Devam ediyor
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDate(event.start_date)}
                  {event.end_date && event.end_date !== event.start_date
                    ? ` – ${formatDate(event.end_date)}`
                    : ""}
                </p>
                {event.description ? (
                  <p className="mt-1 text-sm text-zinc-400">
                    {event.description}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
