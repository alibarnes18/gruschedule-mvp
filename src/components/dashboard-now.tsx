"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassScheduleEntry, Department, Faculty, Section } from "@/lib/data";
import { SectionPicker, type SectionPickerValue } from "@/components/section-picker";
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

const DOT_COLORS = ["#7C3AED", "#3B82F6", "#34D399", "#F59E0B"];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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

  const day = currentDbDay(now);
  const time = currentTimeString(now);

  const todayEntries = useMemo(
    () =>
      sectionEntries
        .filter((e) => e.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [sectionEntries, day],
  );

  const status = useMemo(() => {
    if (!selection?.sectionId) return null;
    const current = sectionEntries.find(
      (e) => e.day_of_week === day && e.start_time <= time && time < e.end_time,
    );
    if (current) return { kind: "current" as const, entry: current };
    const next = findUpcoming(sectionEntries, day, time);
    return next ? { kind: "next" as const, entry: next } : { kind: "none" as const };
  }, [day, time, selection, sectionEntries]);

  const afternoonCount = todayEntries.filter((e) => e.start_time >= "12:00:00").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="gs-card p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
          Şu an ne dersteyim?
        </p>
        <SectionPicker
          faculties={faculties}
          departments={departments}
          sections={sections}
          onChange={setSelection}
        />
      </div>

      {!selection?.sectionId ? (
        <div className="gs-card flex flex-col items-center gap-2 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Şu an hangi derste olduğunu görmek için yukarıdan fakülte, bölüm ve
            şubeni seç.
          </p>
        </div>
      ) : (
        <div className="gs-gradient-border relative overflow-hidden rounded-3xl shadow-[0_0_60px_-18px_rgba(124,58,237,0.55)]">
          <div className="flex flex-wrap items-end justify-between gap-7 rounded-[calc(1.5rem-1px)] bg-[linear-gradient(150deg,rgba(24,20,38,.92),rgba(16,16,19,.94))] p-7 backdrop-blur-xl">
            <div className="min-w-[260px] flex-1 basis-[340px]">
              <div className="mb-3.5 flex items-center gap-2">
                <span className="gs-dot-pulse h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34D399]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {status?.kind === "current"
                    ? "Şu an derste"
                    : status?.kind === "next"
                      ? "Sıradaki ders"
                      : "Bugün ders yok"}
                </span>
              </div>

              {status?.kind === "none" ? (
                <h2 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-[32px]">
                  Seçilen şube için bugüne ders planlanmamış.
                </h2>
              ) : (
                <>
                  <h2 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-[32px]">
                    {status?.entry.course_name}
                  </h2>
                  <div className="mt-3.5 flex flex-wrap gap-x-4.5 gap-y-2 text-[13px] text-muted-foreground">
                    {status?.entry.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V8l6-4 6 4v13M10 21v-6h4v6"/></svg>
                        {status.entry.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2"/></svg>
                      {status?.kind === "next" && status.entry.day_of_week !== day
                        ? `${DAY_NAMES[status.entry.day_of_week]} `
                        : ""}
                      {status ? formatTime(status.entry.start_time) : ""}
                      {status?.kind === "current" ? `–${formatTime(status.entry.end_time)}` : ""}
                    </span>
                    {status?.entry.instructor ? (
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0"/></svg>
                        {status.entry.instructor}
                      </span>
                    ) : null}
                  </div>

                  {status?.kind === "current" ? (
                    (() => {
                      const start = toMinutes(status.entry.start_time.slice(0, 5));
                      const end = toMinutes(status.entry.end_time.slice(0, 5));
                      const nowMin = toMinutes(currentTimeString(now).slice(0, 5));
                      const pct = Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100));
                      const remaining = Math.max(0, end - nowMin);
                      return (
                        <div className="mt-5.5 max-w-[420px]">
                          <div className="h-[5px] overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="gs-gradient-bg h-full rounded-full shadow-[0_0_14px_rgba(99,102,241,0.7)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>Dersin %{Math.round(pct)}&apos;i tamamlandı</span>
                            <span className="text-foreground/80">{remaining} dk kaldı</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </>
              )}
            </div>

            {status?.kind !== "none" && todayEntries.length > 0 ? (
              <div className="flex-none basis-[260px] rounded-2xl border border-border bg-foreground/[0.035] p-4">
                <p className="mb-2.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {status?.kind === "current" ? "Sırada" : "Bugünkü program"}
                </p>
                {status?.kind === "current" ? (
                  (() => {
                    const upcoming = todayEntries.find((e) => e.start_time > status.entry.start_time);
                    return upcoming ? (
                      <>
                        <p className="text-[15px] font-semibold tracking-tight">{upcoming.course_name}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {formatTime(upcoming.start_time)}–{formatTime(upcoming.end_time)}
                          {upcoming.location ? ` · ${upcoming.location}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">Bugün başka dersin yok.</p>
                    );
                  })()
                ) : null}
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Bugün {todayEntries.length} dersin var
                  {afternoonCount > 0 ? `, ${afternoonCount} tanesi öğleden sonra.` : "."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {selection?.sectionId && todayEntries.length > 0 ? (
        <div className="gs-card p-5">
          <p className="mb-3.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Bugün — {DAY_NAMES[day] ?? ""}
          </p>
          <div className="flex flex-col gap-0.5">
            {todayEntries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]"
              >
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{
                    background: DOT_COLORS[i % DOT_COLORS.length],
                    boxShadow: `0 0 10px ${DOT_COLORS[i % DOT_COLORS.length]}`,
                  }}
                />
                <span className="w-[100px] flex-none text-[13px] tabular-nums text-muted-foreground">
                  {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground/90">
                  {entry.course_name}
                </span>
                {entry.location ? (
                  <span className="text-xs text-muted-foreground">{entry.location}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
