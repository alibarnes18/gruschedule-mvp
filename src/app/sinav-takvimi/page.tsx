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
        <h1 className="text-2xl font-semibold text-zinc-50">Sınav Takvimi</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Yaklaşan vize, final ve bütünleme sınavları.
        </p>
      </div>
      <ExamsPageClient faculties={faculties} departments={departments} exams={exams} />
    </div>
  );
}
