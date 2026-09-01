import { EmptyState } from "@/components/empty-state";
import { getMenuDaysInRange } from "@/lib/data";
import { DAY_NAMES, addDays, formatDate, startOfWeek, toIsoDate } from "@/lib/schedule";

export const metadata = {
  title: "Yemekhane Menüsü — Gruschedule",
};

export default async function MenuPage() {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const menuDays = await getMenuDaysInRange(toIsoDate(weekStart), toIsoDate(weekEnd));
  const menuByDate = new Map(menuDays.map((m) => [m.date, m]));
  const todayIso = toIsoDate(today);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Yemekhane Menüsü
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Bu haftanın yemek menüsü.</p>
      </div>

      {menuDays.length === 0 ? (
        <EmptyState>Bu hafta için menü bilgisi bulunamadı.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => {
            const iso = toIsoDate(day);
            const menu = menuByDate.get(iso);
            const dayNumber = day.getDay() === 0 ? 7 : day.getDay();
            const isToday = iso === todayIso;

            return (
              <section
                key={iso}
                className={`rounded-xl border p-4 ${
                  isToday
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <h2 className="text-sm font-semibold text-zinc-200">
                  {DAY_NAMES[dayNumber]}
                  {isToday ? (
                    <span className="ml-2 text-xs font-normal text-emerald-300">
                      Bugün
                    </span>
                  ) : null}
                </h2>
                <p className="text-xs text-zinc-500">{formatDate(iso)}</p>
                <div className="mt-3">
                  {menu ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                      {menu.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">Menü bilgisi yok.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
