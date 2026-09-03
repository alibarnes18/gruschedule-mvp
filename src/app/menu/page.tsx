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
        <p className="mb-2 text-xs uppercase tracking-[0.09em] text-muted-foreground">
          Merkez Yemekhane
        </p>
        <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[36px]">
          Yemekhane Menüsü
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Bu haftanın öğle menüsü.
        </p>
      </div>

      {menuDays.length === 0 ? (
        <EmptyState>Bu hafta için menü bilgisi bulunamadı.</EmptyState>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const iso = toIsoDate(day);
            const menu = menuByDate.get(iso);
            const dayNumber = day.getDay() === 0 ? 7 : day.getDay();
            const isToday = iso === todayIso;

            return (
              <div
                key={iso}
                className={
                  isToday
                    ? "rounded-[19px] p-px shadow-[0_0_50px_-22px_rgba(124,58,237,0.9)]"
                    : "rounded-[19px] bg-foreground/[0.07] p-px"
                }
                style={
                  isToday
                    ? {
                        background:
                          "linear-gradient(150deg,rgba(124,58,237,.9),rgba(59,130,246,.45) 60%,rgba(255,255,255,.06))",
                      }
                    : undefined
                }
              >
                <div
                  className="h-full rounded-[18px] p-5 backdrop-blur-md"
                  style={{
                    background: isToday
                      ? "linear-gradient(170deg,rgba(22,19,34,.96),rgba(16,16,19,.96))"
                      : "var(--color-card)",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <div
                        className="text-sm font-semibold tracking-tight"
                        style={{ color: isToday ? "#F3F1FF" : undefined }}
                      >
                        {DAY_NAMES[dayNumber]}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(iso)}</div>
                    </div>
                    {isToday ? (
                      <span className="gs-gradient-bg whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                        BUGÜN
                      </span>
                    ) : null}
                  </div>
                  {menu ? (
                    <ul className="flex flex-col gap-2.5">
                      {menu.items.map((item, i) => (
                        <li key={i} className="text-[13.5px] leading-tight text-foreground/90">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Menü bilgisi yok.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
