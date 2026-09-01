import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h1 className="text-2xl font-semibold text-foreground">
          Yemekhane Menüsü
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Bu haftanın yemek menüsü.</p>
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
              <Card
                key={iso}
                className={isToday ? "ring-emerald-500/40 bg-emerald-500/5" : undefined}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {DAY_NAMES[dayNumber]}
                    {isToday ? (
                      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                        Bugün
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{formatDate(iso)}</p>
                </CardHeader>
                <CardContent>
                  {menu ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-foreground/90">
                      {menu.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Menü bilgisi yok.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
