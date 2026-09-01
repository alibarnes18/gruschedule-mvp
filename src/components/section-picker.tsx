"use client";

import { useEffect, useState } from "react";
import type { Department, Faculty, Section } from "@/lib/data";
import { loadSavedSection, saveSavedSection } from "@/lib/saved-section";
import { sectionLabel } from "@/lib/schedule";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Fakülte</span>
        <Select value={facultyId || null} onValueChange={(v) => handleFacultyChange(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seçiniz" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Bölüm</span>
        <Select
          value={departmentId || null}
          onValueChange={(v) => handleDepartmentChange(v ?? "")}
          disabled={!facultyId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seçiniz" />
          </SelectTrigger>
          <SelectContent>
            {departmentsInFaculty.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sections && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Sınıf / Şube</span>
          <Select
            value={sectionId || null}
            onValueChange={(v) => handleSectionChange(v ?? "")}
            disabled={!departmentId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {sectionsInDepartment.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {sectionLabel(s.grade_level, s.section_label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
