// The actual "parse bytes -> write to Postgres" logic, factored out of
// parse-pdf's HTTP handler so check-for-updates can call it directly
// in-process instead of making a second HTTP round-trip to itself.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { extractPdfTextByPage } from "./extract-pdf-text.ts";
import { parseClassScheduleGrid } from "./parse-class-schedule-grid.ts";
import { parseExamScheduleGrid } from "./parse-exam-schedule-grid.ts";
import { parseAcademicCalendar } from "./parse-academic-calendar.ts";
import { parseMenu } from "./parse-menu.ts";
import { academicCalendarSources, classScheduleSources, examSources, menuSources } from "./adapters/giresun.ts";
import { sha256Hex } from "./hash.ts";
import { notifyDepartmentSubscribers } from "./notify-changes.ts";
import { EXAM_TYPE_LABELS } from "./tr-format.ts";

export type WriteResult =
  | { ok: true; sourceDocumentId: string; parseStatus: string; entriesWritten: number; flaggedCount: number }
  | { ok: false; error: string; httpStatus: number };

function err(error: string, httpStatus = 500): WriteResult {
  return { ok: false, error, httpStatus };
}

async function resolveDepartment(
  supabase: SupabaseClient,
  facultySlug: string,
  departmentSlug: string,
): Promise<{ id: string } | { error: string }> {
  const { data: faculty, error: facultyError } = await supabase
    .from("faculties")
    .select("id")
    .eq("slug", facultySlug)
    .single();
  if (facultyError || !faculty) {
    return { error: `faculty "${facultySlug}" not found — run the seed migration first` };
  }

  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("id")
    .eq("faculty_id", faculty.id)
    .eq("slug", departmentSlug)
    .single();
  if (departmentError || !department) {
    return { error: `department "${departmentSlug}" not found — run the seed migration first` };
  }

  return { id: department.id };
}

async function insertSourceDocument(
  supabase: SupabaseClient,
  args: { sourceUrl: string; documentType: string; contentHash: string; parseStatus: string },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      source_url: args.sourceUrl,
      document_type: args.documentType,
      content_hash: args.contentHash,
      parse_status: args.parseStatus,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };
  return { id: data.id };
}

function parseStatusFor(entryCount: number, flaggedCount: number): string {
  if (entryCount === 0) return "failed";
  return flaggedCount > 0 ? "needs_review" : "success";
}

export async function writeClassSchedule(
  supabase: SupabaseClient,
  departmentSlug: string,
  pdfBytes: Uint8Array,
  /** The URL these bytes actually came from, if known (check-for-updates
   * resolves it dynamically — see giresun-discovery.ts). Defaults to the
   * adapter's last-known static URL, which parse-pdf's manual/dev HTTP
   * contract has no other way to supply. Storing whichever URL was
   * actually fetched matters: check-for-updates' unchanged/changed check
   * looks up the last hash *by that URL*. */
  sourceUrl?: string,
): Promise<WriteResult> {
  const source = classScheduleSources.find((s) => s.departmentSlug === departmentSlug);
  if (!source) return err(`no class_schedule adapter for "${departmentSlug}"`, 400);

  const department = await resolveDepartment(supabase, source.facultySlug, source.departmentSlug);
  if ("error" in department) return err(department.error);

  // Hash before parsing: pdfjs-dist transfers/detaches the underlying
  // ArrayBuffer when it consumes `pdfBytes`, so hashing afterward silently
  // hashes an empty buffer (seen in production — every content_hash was
  // coming out as SHA-256 of "" until this was hoisted above the parse).
  const contentHash = await sha256Hex(pdfBytes);
  const pages = await extractPdfTextByPage(pdfBytes);
  const entries = parseClassScheduleGrid(pages[0], source.grid);
  const flaggedCount = entries.filter((e) => e.flags.length > 0).length;
  const parseStatus = parseStatusFor(entries.length, flaggedCount);

  const sourceDocument = await insertSourceDocument(supabase, {
    sourceUrl: sourceUrl ?? source.sourceUrl,
    documentType: source.documentType,
    contentHash,
    parseStatus,
  });
  if ("error" in sourceDocument) return err(sourceDocument.error);

  // grade_level + section_label -> sections.id, created on first sight.
  const sectionIdByKey = new Map<string, string>();
  const sectionKey = (gradeLevel: number, sectionLabel: string | null) => `${gradeLevel}:${sectionLabel ?? ""}`;

  for (const entry of entries) {
    const key = sectionKey(entry.gradeLevel, entry.sectionLabel);
    if (sectionIdByKey.has(key)) continue;

    let existingQuery = supabase
      .from("sections")
      .select("id")
      .eq("department_id", department.id)
      .eq("grade_level", entry.gradeLevel);
    existingQuery = entry.sectionLabel === null
      ? existingQuery.is("section_label", null)
      : existingQuery.eq("section_label", entry.sectionLabel);
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      sectionIdByKey.set(key, existing.id);
      continue;
    }

    const { data: created, error: createError } = await supabase
      .from("sections")
      .insert({ department_id: department.id, grade_level: entry.gradeLevel, section_label: entry.sectionLabel })
      .select("id")
      .single();
    if (createError || !created) return err(createError?.message ?? "section insert failed");
    sectionIdByKey.set(key, created.id);
  }

  // Delete scope is every section this department has, not just the ones
  // this parse touched — a section from an older parse that isn't
  // rediscovered this time (bad geometry, a discontinued şube, ...)
  // would otherwise keep its stale entries forever.
  const { data: allDeptSections, error: sectionsError } = await supabase
    .from("sections")
    .select("id")
    .eq("department_id", department.id);
  if (sectionsError) return err(sectionsError.message);

  const allSectionIds = (allDeptSections ?? []).map((s) => s.id);
  if (allSectionIds.length > 0) {
    const { error: deleteError } = await supabase.from("class_schedule_entries").delete().in(
      "section_id",
      allSectionIds,
    );
    if (deleteError) return err(deleteError.message);
  }

  const rows = entries.map((entry) => ({
    section_id: sectionIdByKey.get(sectionKey(entry.gradeLevel, entry.sectionLabel))!,
    course_name: entry.courseName,
    instructor: entry.instructor,
    day_of_week: entry.dayOfWeek,
    start_time: entry.startTime,
    end_time: entry.endTime,
    location: entry.location,
    source_document_id: sourceDocument.id,
  }));

  const { error: insertError } = await supabase.from("class_schedule_entries").insert(rows);
  if (insertError) return err(insertError.message);

  return { ok: true, sourceDocumentId: sourceDocument.id, parseStatus, entriesWritten: rows.length, flaggedCount };
}

export async function writeExamSchedule(
  supabase: SupabaseClient,
  departmentSlug: string,
  pdfBytes: Uint8Array,
  sourceUrl?: string,
): Promise<WriteResult> {
  const source = examSources.find((s) => s.departmentSlug === departmentSlug);
  if (!source) return err(`no exam_schedule adapter for "${departmentSlug}"`, 400);

  const department = await resolveDepartment(supabase, source.facultySlug, source.departmentSlug);
  if ("error" in department) return err(department.error);

  const contentHash = await sha256Hex(pdfBytes); // before parsing — see writeClassSchedule
  const pages = await extractPdfTextByPage(pdfBytes);
  const entries = parseExamScheduleGrid(pages, source.grid);
  const flaggedCount = entries.filter((e) => e.flags.length > 0).length;
  const parseStatus = parseStatusFor(entries.length, flaggedCount);

  const sourceDocument = await insertSourceDocument(supabase, {
    sourceUrl: sourceUrl ?? source.sourceUrl,
    documentType: source.documentType,
    contentHash,
    parseStatus,
  });
  if ("error" in sourceDocument) return err(sourceDocument.error);

  const { data: previousRows } = await supabase
    .from("exam_events")
    .select("course_name, exam_date, exam_time, location")
    .eq("department_id", department.id)
    .eq("exam_type", source.examType);

  const { error: deleteError } = await supabase
    .from("exam_events")
    .delete()
    .eq("department_id", department.id)
    .eq("exam_type", source.examType);
  if (deleteError) return err(deleteError.message);

  const rows = entries.map((entry) => ({
    department_id: department.id,
    exam_type: source.examType,
    course_name: entry.courseName,
    exam_date: entry.examDate,
    exam_time: entry.examTime,
    location: entry.location,
    source_document_id: sourceDocument.id,
  }));

  const { error: insertError } = await supabase.from("exam_events").insert(rows);
  if (insertError) return err(insertError.message);

  if (rows.length > 0 && examRowsChanged(previousRows ?? [], rows)) {
    await notifyExamScheduleChange(supabase, department.id, source.examType);
  }

  return { ok: true, sourceDocumentId: sourceDocument.id, parseStatus, entriesWritten: rows.length, flaggedCount };
}

type ExamRowFields = { course_name: string; exam_date: string; exam_time: string | null; location: string | null };

function examRowsChanged(previous: ExamRowFields[], next: ExamRowFields[]): boolean {
  const fingerprint = (rows: ExamRowFields[]) =>
    rows
      .map((r) => `${r.course_name}|${r.exam_date}|${r.exam_time ?? ""}|${r.location ?? ""}`)
      .sort()
      .join("\n");
  return fingerprint(previous) !== fingerprint(next);
}

async function notifyExamScheduleChange(supabase: SupabaseClient, departmentId: string, examType: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return; // Telegram bot not configured — silently skip
  const label = EXAM_TYPE_LABELS[examType] ?? examType;
  await notifyDepartmentSubscribers(supabase, token, departmentId, `${label} sınav takviminiz güncellendi. /sinavlarim ile kontrol edin.`);
}

// University-wide: only one academic calendar is ever "current", so a
// re-parse fully replaces the table rather than scoping by anything.
export async function writeAcademicCalendar(
  supabase: SupabaseClient,
  pdfBytes: Uint8Array,
  sourceUrl?: string,
): Promise<WriteResult> {
  const source = academicCalendarSources[0];

  const contentHash = await sha256Hex(pdfBytes); // before parsing — see writeClassSchedule
  const pages = await extractPdfTextByPage(pdfBytes);
  const events = parseAcademicCalendar(pages[0], source.config);
  const flaggedCount = events.filter((e) => e.flags.length > 0).length;
  const parseStatus = parseStatusFor(events.length, flaggedCount);

  const sourceDocument = await insertSourceDocument(supabase, {
    sourceUrl: sourceUrl ?? source.sourceUrl,
    documentType: source.documentType,
    contentHash,
    parseStatus,
  });
  if ("error" in sourceDocument) return err(sourceDocument.error);

  const { error: deleteError } = await supabase.from("academic_calendar_events").delete().not("id", "is", null);
  if (deleteError) return err(deleteError.message);

  const rows = events.map((event) => ({
    title: event.title,
    start_date: event.startDate,
    end_date: event.endDate,
    source_document_id: sourceDocument.id,
  }));

  const { error: insertError } = await supabase.from("academic_calendar_events").insert(rows);
  if (insertError) return err(insertError.message);

  return { ok: true, sourceDocumentId: sourceDocument.id, parseStatus, entriesWritten: rows.length, flaggedCount };
}

// University-wide, but incremental (one PDF per month) — upsert on date
// rather than full-replace, so re-parsing September doesn't wipe out
// already-parsed October.
export async function writeMenu(
  supabase: SupabaseClient,
  pdfBytes: Uint8Array,
  sourceUrl?: string,
): Promise<WriteResult> {
  const source = menuSources[0];

  const contentHash = await sha256Hex(pdfBytes); // before parsing — see writeClassSchedule
  const pages = await extractPdfTextByPage(pdfBytes);
  const days = parseMenu(pages[0], source.grid);
  const flaggedCount = days.filter((d) => d.flags.length > 0).length;
  const parseStatus = parseStatusFor(days.length, flaggedCount);

  const sourceDocument = await insertSourceDocument(supabase, {
    sourceUrl: sourceUrl ?? source.sourceUrl,
    documentType: source.documentType,
    contentHash,
    parseStatus,
  });
  if ("error" in sourceDocument) return err(sourceDocument.error);

  const rows = days.map((day) => ({
    date: day.date,
    items: day.items,
    source_document_id: sourceDocument.id,
  }));

  const { error: upsertError } = await supabase.from("menu_days").upsert(rows, { onConflict: "date" });
  if (upsertError) return err(upsertError.message);

  return { ok: true, sourceDocumentId: sourceDocument.id, parseStatus, entriesWritten: rows.length, flaggedCount };
}
