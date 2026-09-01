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
        <h1 className="text-2xl font-semibold text-foreground">Ders Programı</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
