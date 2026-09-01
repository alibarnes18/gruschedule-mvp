import Link from "next/link";
import { DashboardNow } from "@/components/dashboard-now";
import { EmptyState } from "@/components/empty-state";
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
        <h1 className="text-2xl font-semibold text-zinc-50">Anasayfa</h1>
        <p className="mt-1 text-sm text-zinc-400">
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
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              Bugünün Menüsü
            </h2>
            <Link
              href="/menu"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Tüm menü →
            </Link>
          </div>
          <div className="mt-3">
            {todayMenu ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                {todayMenu.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <EmptyState>Bugün için menü bilgisi bulunamadı.</EmptyState>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              Yaklaşan Sınavlar
            </h2>
            <Link
              href="/sinav-takvimi"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Tümü →
            </Link>
          </div>
          <div className="mt-3">
            {nextExams.length === 0 ? (
              <EmptyState>Yaklaşan sınav bulunamadı.</EmptyState>
            ) : (
              <ul className="space-y-3 text-sm">
                {nextExams.map((exam) => (
                  <li key={exam.id} className="flex flex-col">
                    <span className="text-zinc-100">{exam.course_name}</span>
                    <span className="text-xs text-zinc-500">
                      {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type} ·{" "}
                      {departmentById.get(exam.department_id)?.name ?? ""} ·{" "}
                      {formatDate(exam.exam_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">
            Akademik Takvimden Yaklaşanlar
          </h2>
          <Link
            href="/akademik-takvim"
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Tüm takvim →
          </Link>
        </div>
        <div className="mt-3">
          {upcomingCalendarEvents.length === 0 ? (
            <EmptyState>Yaklaşan bir akademik takvim etkinliği yok.</EmptyState>
          ) : (
            <ul className="space-y-3 text-sm">
              {upcomingCalendarEvents.map((event) => (
                <li key={event.id} className="flex flex-col">
                  <span className="text-zinc-100">{event.title}</span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date
                      ? ` – ${formatDate(event.end_date)}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
