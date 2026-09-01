"use client";

import { useMemo, useState } from "react";
import type { Department, ExamEvent, Faculty } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { EXAM_TYPE_LABELS, examToIcsEvent, formatDate, formatTime } from "@/lib/schedule";
import { downloadIcs } from "@/lib/ics";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  exams: ExamEvent[];
};

export function ExamsPageClient({ faculties, departments, exams }: Props) {
  const [selection, setSelection] = useState<SectionPickerValue | null>(null);

  const filtered = useMemo(() => {
    if (!selection?.departmentId) return exams;
    return exams.filter((e) => e.department_id === selection.departmentId);
  }, [exams, selection]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="mb-3 text-xs text-zinc-500">
          Bölümüne göre filtrelemek için fakülte ve bölüm seç. Seçim
          yapmazsan tüm bölümlerin sınavları listelenir.
        </p>
        <SectionPicker
          faculties={faculties}
          departments={departments}
          onChange={setSelection}
          persist={false}
        />
      </section>

      {filtered.length === 0 ? (
        <EmptyState>Kriterlere uyan bir sınav bulunamadı.</EmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                downloadIcs(
                  "sinavlarim.ics",
                  filtered.map((exam) =>
                    examToIcsEvent(exam, departments.find((d) => d.id === exam.department_id)?.name),
                  ),
                )
              }
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              Tüm sınavlarımı indir ({filtered.length})
            </button>
          </div>

          <ul className="flex flex-col gap-3">
            {filtered.map((exam) => (
              <li
                key={exam.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {exam.course_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {departments.find((d) => d.id === exam.department_id)?.name}
                    {exam.location ? ` · ${exam.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-zinc-800 px-2 py-1 font-medium text-zinc-300">
                    {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                  </span>
                  <span className="text-zinc-400">
                    {formatDate(exam.exam_date)}
                    {exam.exam_time ? ` · ${formatTime(exam.exam_time)}` : ""}
                  </span>
                  <AddToCalendarButton
                    filename={`${exam.course_name}.ics`}
                    event={examToIcsEvent(exam, departments.find((d) => d.id === exam.department_id)?.name)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
