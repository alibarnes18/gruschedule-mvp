"use client";

import { useEffect, useState } from "react";
import type { Department, Faculty, Section } from "@/lib/data";
import { loadSavedSection, saveSavedSection } from "@/lib/saved-section";
import { sectionLabel } from "@/lib/schedule";

export type SectionPickerValue = {
  facultyId: string;
  departmentId: string;
  sectionId: string | null;
};

type Props = {
  faculties: Faculty[];
  departments: Department[];
  sections?: Section[];
  onChange: (value: SectionPickerValue) => void;
  persist?: boolean;
};

const selectClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none disabled:opacity-40";

export function SectionPicker({
  faculties,
  departments,
  sections,
  onChange,
  persist = true,
}: Props) {
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sectionId, setSectionId] = useState("");

  useEffect(() => {
    if (!persist) return;
    const saved = loadSavedSection();
    if (!saved) return;
    if (!faculties.some((f) => f.id === saved.facultyId)) return;
    // localStorage is unavailable during SSR, so the saved selection can only
    // be applied after mount — this is the standard pattern for avoiding a
    // hydration mismatch between the server-rendered defaults and the
    // client's persisted state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFacultyId(saved.facultyId);
    if (departments.some((d) => d.id === saved.departmentId)) {
      setDepartmentId(saved.departmentId);
    }
    if (saved.sectionId && sections?.some((s) => s.id === saved.sectionId)) {
      setSectionId(saved.sectionId);
    }
    onChange({
      facultyId: saved.facultyId,
      departmentId: saved.departmentId,
      sectionId: saved.sectionId,
    });
    // Only run once on mount to hydrate from localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentsInFaculty = departments.filter(
    (d) => d.faculty_id === facultyId,
  );
  const sectionsInDepartment = (sections ?? []).filter(
    (s) => s.department_id === departmentId,
  );

  function emit(next: SectionPickerValue) {
    onChange(next);
    if (persist) saveSavedSection(next);
  }

  function handleFacultyChange(nextFacultyId: string) {
    setFacultyId(nextFacultyId);
    setDepartmentId("");
    setSectionId("");
    emit({ facultyId: nextFacultyId, departmentId: "", sectionId: null });
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    setDepartmentId(nextDepartmentId);
    setSectionId("");
    emit({ facultyId, departmentId: nextDepartmentId, sectionId: null });
  }

  function handleSectionChange(nextSectionId: string) {
    setSectionId(nextSectionId);
    emit({ facultyId, departmentId, sectionId: nextSectionId || null });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Fakülte
        <select
          className={selectClass}
          value={facultyId}
          onChange={(e) => handleFacultyChange(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Bölüm
        <select
          className={selectClass}
          value={departmentId}
          disabled={!facultyId}
          onChange={(e) => handleDepartmentChange(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {departmentsInFaculty.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      {sections && (
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Sınıf / Şube
          <select
            className={selectClass}
            value={sectionId}
            disabled={!departmentId}
            onChange={(e) => handleSectionChange(e.target.value)}
          >
            <option value="">Seçiniz</option>
            {sectionsInDepartment.map((s) => (
              <option key={s.id} value={s.id}>
                {sectionLabel(s.grade_level, s.section_label)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
