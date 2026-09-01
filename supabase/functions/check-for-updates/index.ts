// Polls each known document source for a new/changed PDF and writes it
// via the same functions parse-pdf uses (in-process, no HTTP hop — see
// ../_shared/write-parsed-documents.ts). Meant to be called by pg_cron
// every few hours (see supabase/migrations/*_check_for_updates_cron.sql);
// also safe to call manually/repeatedly, since re-fetching an unchanged
// PDF is a no-op.
//
// None of these documents live at a fixed URL (see documentSources in
// _shared/adapters/giresun.ts), so "checking for updates" means
// re-resolving the current PDF URL by scraping the listing/announcement
// pages (_shared/adapters/giresun-discovery.ts), then comparing its
// content hash against the last time *that exact URL* was fetched. A
// resolved URL that's never been seen before (new semester, new month)
// always triggers a write — there's nothing to compare it to yet.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { sha256Hex } from "../_shared/hash.ts";
import {
  type WriteResult,
  writeAcademicCalendar,
  writeClassSchedule,
  writeExamSchedule,
  writeMenu,
} from "../_shared/write-parsed-documents.ts";
import {
  resolveAcademicCalendarUrl,
  resolveClassScheduleUrl,
  resolveExamScheduleUrl,
  resolveMenuUrl,
} from "../_shared/adapters/giresun-discovery.ts";

interface CheckResult {
  documentType: string;
  departmentSlug?: string;
  sourceUrl?: string;
  status: "changed" | "unchanged" | "not_published" | "fetch_failed" | "resolve_failed" | "write_failed";
  detail?: string;
  write?: Omit<Extract<WriteResult, { ok: true }>, "ok">;
}

async function checkAndMaybeWrite(
  supabase: SupabaseClient,
  documentType: string,
  departmentSlug: string | undefined,
  resolve: () => Promise<string | null>,
  write: (supabase: SupabaseClient, pdfBytes: Uint8Array, sourceUrl: string) => Promise<WriteResult>,
): Promise<CheckResult> {
  let sourceUrl: string | null;
  try {
    sourceUrl = await resolve();
  } catch (e) {
    return { documentType, departmentSlug, status: "resolve_failed", detail: String(e) };
  }
  if (!sourceUrl) return { documentType, departmentSlug, status: "not_published" };

  const pdfRes = await fetch(sourceUrl);
  if (!pdfRes.ok) {
    return { documentType, departmentSlug, sourceUrl, status: "fetch_failed", detail: `HTTP ${pdfRes.status}` };
  }
  const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
  const hash = await sha256Hex(pdfBytes);

  const { data: last } = await supabase
    .from("source_documents")
    .select("content_hash")
    .eq("source_url", sourceUrl)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last?.content_hash === hash) {
    return { documentType, departmentSlug, sourceUrl, status: "unchanged" };
  }

  const result = await write(supabase, pdfBytes, sourceUrl);
  if (!result.ok) return { documentType, departmentSlug, sourceUrl, status: "write_failed", detail: result.error };

  const { ok: _ok, ...writeSummary } = result;
  return { documentType, departmentSlug, sourceUrl, status: "changed", write: writeSummary };
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results = await Promise.all([
    checkAndMaybeWrite(
      supabase,
      "class_schedule",
      "bilgisayar-muhendisligi",
      resolveClassScheduleUrl,
      (s, b, u) => writeClassSchedule(s, "bilgisayar-muhendisligi", b, u),
    ),
    checkAndMaybeWrite(
      supabase,
      "exam_schedule",
      "bilgisayar-muhendisligi",
      () => resolveExamScheduleUrl("Bilgisayar"),
      (s, b, u) => writeExamSchedule(s, "bilgisayar-muhendisligi", b, u),
    ),
    checkAndMaybeWrite(supabase, "academic_calendar", undefined, () => resolveAcademicCalendarUrl(), writeAcademicCalendar),
    checkAndMaybeWrite(supabase, "menu", undefined, () => resolveMenuUrl(), writeMenu),
  ]);

  return Response.json({ checkedAt: new Date().toISOString(), results });
});
