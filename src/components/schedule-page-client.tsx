"use client";

import { useMemo, useState } from "react";
import type { ClassScheduleEntry, Department, Faculty, Section } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { DAY_NAMES, WEEKDAY_ORDER, formatTime } from "@/lib/schedule";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  sections: Section[];
  entries: ClassScheduleEntry[];
};

export function SchedulePageClient({ faculties, departments, sections, entries }: Props) {
  const [selection, setSelection] = useState<SectionPickerValue | null>(null);

  const sectionEntries = useMemo(
    () =>
      selection?.sectionId
        ? entries.filter((e) => e.section_id === selection.sectionId)
        : [],
    [entries, selection],
  );

  const timeSlots = useMemo(() => {
    const slots = new Map<string, string>();
    for (const entry of sectionEntries) {
      slots.set(entry.start_time, entry.end_time);
    }
    return [...slots.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sectionEntries]);

  const entryAt = (day: number, startTime: string) =>
    sectionEntries.find(
      (e) => e.day_of_week === day && e.start_time === startTime,
    );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <SectionPicker
          faculties={faculties}
          departments={departments}
          sections={sections}
          onChange={setSelection}
        />
      </section>

      {!selection?.sectionId ? (
        <EmptyState>
          Ders programını görmek için fakülte, bölüm ve şubeni seç.
        </EmptyState>
      ) : timeSlots.length === 0 ? (
        <EmptyState>Seçilen şube için ders programı bulunamadı.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900">
                <th className="w-28 border-b border-zinc-800 px-3 py-2 text-left text-xs font-medium text-zinc-400">
                  Saat
                </th>
                {WEEKDAY_ORDER.map((day) => (
                  <th
                    key={day}
                    className="border-b border-zinc-800 px-3 py-2 text-left text-xs font-medium text-zinc-400"
                  >
                    {DAY_NAMES[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(([startTime, endTime]) => (
                <tr key={startTime} className="border-b border-zinc-900">
                  <td className="px-3 py-2 align-top text-xs text-zinc-500">
                    {formatTime(startTime)}–{formatTime(endTime)}
                  </td>
                  {WEEKDAY_ORDER.map((day) => {
                    const entry = entryAt(day, startTime);
                    return (
                      <td key={day} className="px-3 py-2 align-top">
                        {entry ? (
                          <div className="rounded-md bg-zinc-800/70 px-2 py-1.5">
                            <p className="text-sm font-medium text-zinc-100">
                              {entry.course_name}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {[entry.instructor, entry.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
