"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Department, ExamEvent, Faculty } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXAM_TYPE_LABELS, examToIcsEvent, formatDate, formatTime } from "@/lib/schedule";
import { downloadIcs } from "@/lib/ics";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  exams: ExamEvent[];
};

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
      <Card>
        <CardContent className="flex flex-col gap-3">
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
        </CardContent>
      </Card>

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

          <div className="flex flex-col gap-3">
            {filtered.map((exam) => (
              <Card key={exam.id} className="py-4">
                <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {exam.course_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {departments.find((d) => d.id === exam.department_id)?.name}
                      {exam.location ? ` · ${exam.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">
                      {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDate(exam.exam_date)}
                      {exam.exam_time ? ` · ${formatTime(exam.exam_time)}` : ""}
                    </span>
                    <AddToCalendarButton
                      filename={`${exam.course_name}.ics`}
                      event={examToIcsEvent(exam, departments.find((d) => d.id === exam.department_id)?.name)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
