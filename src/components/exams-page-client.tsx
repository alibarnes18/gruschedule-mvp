"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Department, ExamEvent, Faculty } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { Button } from "@/components/ui/button";
import { EXAM_TYPE_LABELS, examToIcsEvent, formatDate, formatTime } from "@/lib/schedule";
import { downloadIcs } from "@/lib/ics";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  exams: ExamEvent[];
};

const EXAM_BADGE_CLASS: Record<string, string> = {
  midterm: "gs-badge-vize",
  final: "gs-badge-final",
  makeup: "gs-badge-butunleme",
};

const MONTHS_TR = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

function examDateParts(dateStr: string): { day: string; month: string } {
  const date = new Date(`${dateStr}T00:00:00`);
  return { day: String(date.getDate()).padStart(2, "0"), month: MONTHS_TR[date.getMonth()] };
}

export function ExamsPageClient({ faculties, departments, exams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selection: SectionPickerValue = useMemo(
    () => ({
      facultyId: searchParams.get("fakulte") ?? "",
      departmentId: searchParams.get("bolum") ?? "",
      sectionId: null,
    }),
    [searchParams],
  );

  const handleChange = useCallback(
    (next: SectionPickerValue) => {
      const params = new URLSearchParams();
      if (next.facultyId) params.set("fakulte", next.facultyId);
      if (next.departmentId) params.set("bolum", next.departmentId);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const filtered = useMemo(() => {
    if (!selection.departmentId) return exams;
    return exams.filter((e) => e.department_id === selection.departmentId);
  }, [exams, selection]);

  return (
    <div className="flex flex-col gap-6">
      <div className="gs-card flex flex-col gap-3 p-4">
        <p className="text-xs text-muted-foreground">
          Bölümüne göre filtrelemek için fakülte ve bölüm seç. Seçim
          yapmazsan tüm bölümlerin sınavları listelenir.
        </p>
        <SectionPicker
          faculties={faculties}
          departments={departments}
          value={selection}
          onChange={handleChange}
          persist={false}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState>Kriterlere uyan bir sınav bulunamadı.</EmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadIcs(
                  "sinavlarim.ics",
                  filtered.map((exam) =>
                    examToIcsEvent(exam, departments.find((d) => d.id === exam.department_id)?.name),
                  ),
                )
              }
            >
              Tüm sınavlarımı indir ({filtered.length})
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {filtered.map((exam) => {
              const { day, month } = examDateParts(exam.exam_date);
              return (
                <div
                  key={exam.id}
                  className="gs-card flex flex-wrap items-center gap-4.5 p-4.5 sm:gap-5 sm:px-5 sm:py-4.5"
                >
                  <div className="flex-none rounded-2xl border border-border bg-foreground/[0.04] px-0 py-2.5 text-center" style={{ width: 58 }}>
                    <div className="text-xl font-bold leading-none tracking-tight">{day}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                      {month}
                    </div>
                  </div>
                  <div className="min-w-[180px] flex-1 basis-[220px]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[15px] font-semibold tracking-tight">
                        {exam.course_name}
                      </span>
                      <span
                        className={`${EXAM_BADGE_CLASS[exam.exam_type] ?? "gs-badge-vize"} whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold`}
                      >
                        {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {departments.find((d) => d.id === exam.department_id)?.name}
                    </p>
                  </div>
                  <div className="min-w-[80px] text-[13px] tabular-nums text-muted-foreground">
                    {exam.exam_time ? formatTime(exam.exam_time) : formatDate(exam.exam_date)}
                  </div>
                  {exam.location ? (
                    <div className="min-w-[120px] text-[13px] text-muted-foreground">{exam.location}</div>
                  ) : null}
                  <AddToCalendarButton
                    filename={`${exam.course_name}.ics`}
                    event={examToIcsEvent(exam, departments.find((d) => d.id === exam.department_id)?.name)}
                    iconOnly
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
