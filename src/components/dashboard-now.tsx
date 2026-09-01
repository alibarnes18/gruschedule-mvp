"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassScheduleEntry, Department, Faculty, Section } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DAY_NAMES,
  WEEKDAY_ORDER,
  currentDbDay,
  currentTimeString,
  formatTime,
} from "@/lib/schedule";

type Props = {
  faculties: Faculty[];
  departments: Department[];
  sections: Section[];
  entries: ClassScheduleEntry[];
};

function findUpcoming(
  entries: ClassScheduleEntry[],
  fromDay: number,
  fromTime: string,
) {
  const order = [
    fromDay,
    ...WEEKDAY_ORDER.filter((d) => d !== fromDay),
  ];
  for (const day of order) {
    const dayEntries = entries
      .filter((e) => e.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (const entry of dayEntries) {
      const isToday = day === fromDay;
      if (!isToday || entry.end_time > fromTime) {
        return entry;
      }
    }
  }
  return null;
}

export function DashboardNow({ faculties, departments, sections, entries }: Props) {
  const [selection, setSelection] = useState<SectionPickerValue | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sectionEntries = useMemo(
    () =>
      selection?.sectionId
        ? entries.filter((e) => e.section_id === selection.sectionId)
        : [],
    [entries, selection],
  );

  const status = useMemo(() => {
    if (!selection?.sectionId) return null;
    const day = currentDbDay(now);
    const time = currentTimeString(now);
    const current = sectionEntries.find(
      (e) => e.day_of_week === day && e.start_time <= time && time < e.end_time,
    );
    if (current) return { kind: "current" as const, entry: current };
    const next = findUpcoming(sectionEntries, day, time);
    return next ? { kind: "next" as const, entry: next } : { kind: "none" as const };
  }, [now, selection, sectionEntries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Şu An</CardTitle>
        <CardDescription>
          Programını görmek için fakülte, bölüm ve şubeni seç — seçimin bu
          tarayıcıda hatırlanır.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SectionPicker
          faculties={faculties}
          departments={departments}
          sections={sections}
          onChange={setSelection}
        />

        {!selection?.sectionId ? (
          <p className="text-sm text-muted-foreground">
            Şu an hangi derste olduğunu görmek için yukarıdan şubeni seç.
          </p>
        ) : status?.kind === "current" ? (
          <p className="text-sm text-foreground">
            Şu an{" "}
            <span className="font-semibold">{status.entry.course_name}</span>{" "}
            dersindesin
            {status.entry.location ? (
              <>
                , <span className="font-semibold">{status.entry.location}</span>{" "}
                binasında/salonunda
              </>
            ) : null}{" "}
            ({formatTime(status.entry.start_time)}–{formatTime(status.entry.end_time)}).
          </p>
        ) : status?.kind === "next" ? (
          <p className="text-sm text-foreground">
            Şu an dersin yok. Sıradaki ders:{" "}
            <span className="font-semibold">{status.entry.course_name}</span>{" "}
            — {DAY_NAMES[status.entry.day_of_week]}{" "}
            {formatTime(status.entry.start_time)}
            {status.entry.location ? ` · ${status.entry.location}` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seçilen şube için ders programı bulunamadı.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
