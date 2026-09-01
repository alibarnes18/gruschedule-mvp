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
        <Card className="py-0">
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
      )}
    </div>
  );
}
