import Link from "next/link";
import { DashboardNow } from "@/components/dashboard-now";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAcademicCalendarEvents,
  getClassScheduleEntries,
  getDepartments,
  getFaculties,
  getMenuDay,
  getSections,
  getUpcomingExamEvents,
} from "@/lib/data";
import { EXAM_TYPE_LABELS, formatDate, toIsoDate } from "@/lib/schedule";

export default async function DashboardPage() {
  const today = toIsoDate(new Date());

  const [
    faculties,
    departments,
    sections,
    entries,
    upcomingExams,
    calendarEvents,
    todayMenu,
  ] = await Promise.all([
    getFaculties(),
    getDepartments(),
    getSections(),
    getClassScheduleEntries(),
    getUpcomingExamEvents(today),
    getAcademicCalendarEvents(),
    getMenuDay(today),
  ]);

  const departmentById = new Map(departments.map((d) => [d.id, d]));
  const nextExams = upcomingExams.slice(0, 3);
  const upcomingCalendarEvents = calendarEvents
    .filter((e) => (e.end_date ?? e.start_date) >= today)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Anasayfa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Giresun Üniversitesi ders programı, sınav takvimi, akademik takvim
          ve yemekhane menüsü tek yerde.
        </p>
      </div>

      <DashboardNow
        faculties={faculties}
        departments={departments}
        sections={sections}
        entries={entries}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bugünün Menüsü</CardTitle>
            <CardAction>
              <Link
                href="/menu"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tüm menü →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {todayMenu ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-foreground/90">
                {todayMenu.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <EmptyState>Bugün için menü bilgisi bulunamadı.</EmptyState>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Sınavlar</CardTitle>
            <CardAction>
              <Link
                href="/sinav-takvimi"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tümü →
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {nextExams.length === 0 ? (
              <EmptyState>Yaklaşan sınav bulunamadı.</EmptyState>
            ) : (
              <ul className="space-y-3 text-sm">
                {nextExams.map((exam) => (
                  <li key={exam.id} className="flex flex-col gap-1">
                    <span className="text-foreground">{exam.course_name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                      </Badge>
                      {departmentById.get(exam.department_id)?.name ?? ""} ·{" "}
                      {formatDate(exam.exam_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Akademik Takvimden Yaklaşanlar</CardTitle>
          <CardAction>
            <Link
              href="/akademik-takvim"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tüm takvim →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {upcomingCalendarEvents.length === 0 ? (
            <EmptyState>Yaklaşan bir akademik takvim etkinliği yok.</EmptyState>
          ) : (
            <ul className="space-y-3 text-sm">
              {upcomingCalendarEvents.map((event) => (
                <li key={event.id} className="flex flex-col">
                  <span className="text-foreground">{event.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date
                      ? ` – ${formatDate(event.end_date)}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
