"use client";

import { useMemo, useState } from "react";
import type { ClassScheduleEntry, Department, Faculty, Section } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAY_NAMES, WEEKDAY_ORDER, currentDbDay, formatTime } from "@/lib/schedule";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  sections: Section[];
  entries: ClassScheduleEntry[];
};

function defaultWeekday(): number {
  const today = currentDbDay(new Date());
  return WEEKDAY_ORDER.includes(today as (typeof WEEKDAY_ORDER)[number]) ? today : WEEKDAY_ORDER[0];
}

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

  const entriesByDay = (day: number) =>
    sectionEntries
      .filter((e) => e.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const todayDb = currentDbDay(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="gs-card p-4">
        <SectionPicker
          faculties={faculties}
          departments={departments}
          sections={sections}
          onChange={setSelection}
        />
      </div>

      {!selection?.sectionId ? (
        <EmptyState>
          Ders programını görmek için fakülte, bölüm ve şubeni seç.
        </EmptyState>
      ) : timeSlots.length === 0 ? (
        <EmptyState>Seçilen şube için ders programı bulunamadı.</EmptyState>
      ) : (
        <>
          {/* Mobile: one day at a time via Tabs */}
          <div className="md:hidden">
            <Tabs defaultValue={String(defaultWeekday())}>
              <TabsList className="w-full">
                {WEEKDAY_ORDER.map((day) => (
                  <TabsTrigger key={day} value={String(day)} className="px-1 text-xs">
                    {DAY_NAMES[day].slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {WEEKDAY_ORDER.map((day) => {
                const dayEntries = entriesByDay(day);
                return (
                  <TabsContent key={day} value={String(day)} className="mt-3">
                    {dayEntries.length === 0 ? (
                      <EmptyState>{DAY_NAMES[day]} günü için ders yok.</EmptyState>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {dayEntries.map((entry) => (
                          <div key={entry.id} className="gs-card flex items-start justify-between gap-3 p-3.5">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {entry.course_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[entry.instructor, entry.location]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          {/* Desktop: full weekly grid */}
          <div className="hidden overflow-x-auto pb-1.5 md:block">
            <div className="gs-card min-w-[820px] overflow-hidden">
              <div
                className="grid border-b border-border"
                style={{ gridTemplateColumns: "96px repeat(5, 1fr)" }}
              >
                <div />
                {WEEKDAY_ORDER.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-3.5 text-xs font-semibold tracking-wide border-l border-border"
                    style={{
                      color: day === todayDb ? "#C4B5FD" : undefined,
                      background: day === todayDb ? "rgba(124,58,237,.07)" : undefined,
                    }}
                  >
                    <span className={day === todayDb ? "" : "text-muted-foreground"}>
                      {DAY_NAMES[day]}
                    </span>
                  </div>
                ))}
              </div>
              {timeSlots.map(([startTime, endTime]) => (
                <div
                  key={startTime}
                  className="grid border-b border-border/60 last:border-0"
                  style={{ gridTemplateColumns: "96px repeat(5, 1fr)" }}
                >
                  <div className="border-r border-border/60 px-3 py-3.5 text-xs tabular-nums text-muted-foreground">
                    {formatTime(startTime)}–{formatTime(endTime)}
                  </div>
                  {WEEKDAY_ORDER.map((day) => {
                    const entry = entryAt(day, startTime);
                    return (
                      <div key={day} className="min-h-[82px] border-r border-border/60 p-2 last:border-0">
                        {entry ? (
                          <div className="h-full rounded-[13px] bg-[linear-gradient(140deg,rgba(124,58,237,.55),rgba(59,130,246,.3)_60%,rgba(255,255,255,.06))] p-px transition-transform hover:-translate-y-0.5">
                            <div className="h-full rounded-[12px] bg-background/95 px-3 py-2.5">
                              <p className="text-[13px] font-semibold leading-tight tracking-tight text-foreground">
                                {entry.course_name}
                              </p>
                              {entry.location ? (
                                <p className="mt-1.5 text-[11px] text-muted-foreground">{entry.location}</p>
                              ) : null}
                              {entry.instructor ? (
                                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{entry.instructor}</p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
