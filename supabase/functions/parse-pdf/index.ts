// Parses a Giresun Üniversitesi PDF and writes the result to
// source_documents + the relevant content table(s). The actual parsing
// and DB-write logic lives in ../_shared/write-parsed-documents.ts so
// check-for-updates can call it directly without a second HTTP hop.
//
// Contract (v1, manual/dev — check-for-updates calls the same underlying
// functions once Faz 3 wires up the real PDF discovery):
//   POST /parse-pdf?type=<class_schedule|exam_schedule|academic_calendar|menu>[&department=<departmentSlug>]
//   body: raw PDF bytes, Content-Type: application/pdf
//
// `department` is required for class_schedule/exam_schedule (per-department
// PDFs) and ignored for academic_calendar/menu (university-wide).
//
// Re-running replaces the previous parse: fully, for class_schedule (that
// department's sections), exam_schedule (that department+exam_type), and
// academic_calendar (the whole table, since only one calendar is ever
// current); by date-upsert for menu, since each PDF only covers one month
// and re-parsing September shouldn't erase October.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type WriteResult,
  writeAcademicCalendar,
  writeClassSchedule,
  writeExamSchedule,
  writeMenu,
} from "../_shared/write-parsed-documents.ts";

function toResponse(result: WriteResult): Response {
  if (!result.ok) return Response.json({ error: result.error }, { status: result.httpStatus });
  const { ok: _ok, ...body } = result;
  return Response.json(body);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("expected POST", { status: 405 });
  }

  const url = new URL(req.url);
  const departmentSlug = url.searchParams.get("department");
  const documentType = url.searchParams.get("type") ?? "class_schedule";

  const pdfBytes = new Uint8Array(await req.arrayBuffer());
  if (pdfBytes.length === 0) {
    return Response.json({ error: "empty request body, expected a PDF" }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (documentType === "academic_calendar") {
    return toResponse(await writeAcademicCalendar(supabase, pdfBytes));
  }
  if (documentType === "menu") {
    return toResponse(await writeMenu(supabase, pdfBytes));
  }

  if (!departmentSlug) {
    return Response.json({ error: "missing ?department=<slug>" }, { status: 400 });
  }
  if (documentType === "class_schedule") {
    return toResponse(await writeClassSchedule(supabase, departmentSlug, pdfBytes));
  }
  if (documentType === "exam_schedule") {
    return toResponse(await writeExamSchedule(supabase, departmentSlug, pdfBytes));
  }
  return Response.json({ error: `unknown type "${documentType}"` }, { status: 400 });
});
