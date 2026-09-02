"use client";

import { useMemo, useState } from "react";
import type { ClassScheduleEntry, Department, Faculty, Section } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <SectionPicker
            faculties={faculties}
            departments={departments}
            sections={sections}
            onChange={setSelection}
          />
        </CardContent>
      </Card>

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
                          <Card key={entry.id} className="py-3">
                            <CardContent className="flex items-start justify-between gap-3">
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
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                              </span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          {/* Desktop: full weekly grid */}
          <Card className="hidden py-0 md:block">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Saat</TableHead>
                  {WEEKDAY_ORDER.map((day) => (
                    <TableHead key={day}>{DAY_NAMES[day]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map(([startTime, endTime]) => (
                  <TableRow key={startTime}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(startTime)}–{formatTime(endTime)}
                    </TableCell>
                    {WEEKDAY_ORDER.map((day) => {
                      const entry = entryAt(day, startTime);
                      return (
                        <TableCell key={day} className="whitespace-normal align-top">
                          {entry ? (
                            <div className="rounded-md bg-muted px-2 py-1.5">
                              <p className="text-sm font-medium text-foreground">
                                {entry.course_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[entry.instructor, entry.location]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          ) : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
