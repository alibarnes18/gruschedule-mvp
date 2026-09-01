import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Faculty = Database["public"]["Tables"]["faculties"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type Section = Database["public"]["Tables"]["sections"]["Row"];
export type ClassScheduleEntry =
  Database["public"]["Tables"]["class_schedule_entries"]["Row"];
export type ExamEvent = Database["public"]["Tables"]["exam_events"]["Row"];
export type AcademicCalendarEvent =
  Database["public"]["Tables"]["academic_calendar_events"]["Row"];
export type MenuDay = Database["public"]["Tables"]["menu_days"]["Row"];

export async function getFaculties(): Promise<Faculty[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getSections(): Promise<Section[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("grade_level");
  if (error) throw error;
  return data ?? [];
}

export async function getClassScheduleEntries(): Promise<
  ClassScheduleEntry[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_schedule_entries")
    .select("*")
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingExamEvents(
  fromDate: string,
): Promise<ExamEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_events")
    .select("*")
    .gte("exam_date", fromDate)
    .order("exam_date")
    .order("exam_time");
  if (error) throw error;
  return data ?? [];
}

export async function getAcademicCalendarEvents(): Promise<
  AcademicCalendarEvent[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_calendar_events")
    .select("*")
    .order("start_date");
  if (error) throw error;
  return data ?? [];
}

export async function getMenuDaysInRange(
  fromDate: string,
  toDate: string,
): Promise<MenuDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_days")
    .select("*")
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");
  if (error) throw error;
  return data ?? [];
}

export async function getMenuDay(date: string): Promise<MenuDay | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_days")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}
