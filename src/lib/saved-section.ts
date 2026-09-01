export type SavedSection = {
  facultyId: string;
  departmentId: string;
  sectionId: string | null;
};

const STORAGE_KEY = "gruschedule:section";

export function loadSavedSection(): SavedSection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSection;
  } catch {
    return null;
  }
}

export function saveSavedSection(value: SavedSection): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
