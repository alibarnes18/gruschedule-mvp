import { SchedulePageClient } from "@/components/schedule-page-client";
import {
  getClassScheduleEntries,
  getDepartments,
  getFaculties,
  getSections,
} from "@/lib/data";

export const metadata = {
  title: "Ders Programı — Gruschedule",
};

export default async function ClassSchedulePage() {
  const [faculties, departments, sections, entries] = await Promise.all([
    getFaculties(),
    getDepartments(),
    getSections(),
    getClassScheduleEntries(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.09em] text-muted-foreground">Haftalık</p>
        <h1 className="text-[28px] font-bold leading-[1.05] tracking-tight text-foreground sm:text-[36px]">
          Ders Programı
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Fakülte, bölüm ve şubeni seçerek haftalık ders programını görüntüle.
        </p>
      </div>
      <SchedulePageClient
        faculties={faculties}
        departments={departments}
        sections={sections}
        entries={entries}
      />
    </div>
  );
}
