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
import { StaggerContainer, StaggerItem } from "@/components/animation-wrapper";
import BlurText from "@/components/BlurText";

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

  const examBadgeClass: Record<string, string> = {
    midterm: "gs-badge-vize",
    final: "gs-badge-final",
    makeup: "gs-badge-butunleme",
  };

  return (
    <StaggerContainer className="flex flex-col gap-8">
      <StaggerItem>
        <BlurText
          text="Anasayfa"
          delay={150}
          animateBy="words"
          direction="top"
          className="text-3xl font-bold tracking-tight text-foreground"
        />
        <p className="mt-2 text-base text-muted-foreground">
          Giresun Üniversitesi ders programı, sınav takvimi, akademik takvim
          ve yemekhane menüsü tek yerde.
        </p>
      </StaggerItem>

      <StaggerItem>
        <DashboardNow
          faculties={faculties}
          departments={departments}
          sections={sections}
          entries={entries}
        />
      </StaggerItem>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem className="h-full lg:col-span-2">
          <div className="gs-card flex h-full flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Yaklaşan sınavlar
              </p>
              <Link
                href="/sinav-takvimi"
                className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Tümü →
              </Link>
            </div>
            {nextExams.length === 0 ? (
              <EmptyState>Yaklaşan sınav bulunamadı.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3.5 text-sm">
                {nextExams.map((exam) => (
                  <li key={exam.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{exam.course_name}</span>
                      <span
                        className={`${examBadgeClass[exam.exam_type] ?? "gs-badge-vize"} rounded-full px-2.5 py-0.5 text-[11px] font-semibold`}
                      >
                        {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {departmentById.get(exam.department_id)?.name ?? ""} ·{" "}
                      {formatDate(exam.exam_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="h-full lg:col-span-1">
          <div className="gs-card flex h-full flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Bugünün menüsü
              </p>
              <Link
                href="/menu"
                className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Tümü →
              </Link>
            </div>
            {todayMenu ? (
              <ul className="flex flex-col gap-2 text-sm text-foreground/90">
                {todayMenu.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <EmptyState>Bugün için menü bilgisi bulunamadı.</EmptyState>
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="h-full lg:col-span-1">
          <div className="gs-card flex h-full flex-col p-5">
            <p className="mb-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              Akademik takvim
            </p>
            {upcomingCalendarEvents.length === 0 ? (
              <EmptyState>Yaklaşan bir akademik takvim etkinliği yok.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3.5 text-sm">
                {upcomingCalendarEvents.map((event) => (
                  <li key={event.id} className="flex flex-col gap-1">
                    <span className="font-medium leading-snug text-foreground">{event.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date
                        ? ` – ${formatDate(event.end_date)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/akademik-takvim"
              className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Tüm takvim →
            </Link>
          </div>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
