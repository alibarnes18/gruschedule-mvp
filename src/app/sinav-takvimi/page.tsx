import { Suspense } from "react";
import { ExamsPageClient } from "@/components/exams-page-client";
import { getDepartments, getFaculties, getUpcomingExamEvents } from "@/lib/data";
import { toIsoDate } from "@/lib/schedule";

export const metadata = {
  title: "Sınav Takvimi — Gruschedule",
};

export default async function ExamSchedulePage() {
  const today = toIsoDate(new Date());
  const [faculties, departments, exams] = await Promise.all([
    getFaculties(),
    getDepartments(),
    getUpcomingExamEvents(today),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.09em] text-muted-foreground">
          Vize · Final · Bütünleme
        </p>
        <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[36px]">
          Sınav Takvimi
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Yaklaşan vize, final ve bütünleme sınavları.
        </p>
      </div>
      <Suspense>
        <ExamsPageClient faculties={faculties} departments={departments} exams={exams} />
      </Suspense>
    </div>
  );
}
