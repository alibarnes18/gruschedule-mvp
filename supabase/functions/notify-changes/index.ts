// Manual/admin trigger for spec.md section 4's notify-changes function.
// writeExamSchedule (see ../_shared/write-parsed-documents.ts) calls the
// same underlying helper directly on every exam schedule change, so this
// HTTP entrypoint exists for ad-hoc/manual notifications rather than being
// part of the normal parse-pdf flow.
//
//   POST /notify-changes
//   body: { "departmentId": "<uuid>", "message": "<text>" }

import { createClient } from "npm:@supabase/supabase-js@2";
import { notifyDepartmentSubscribers } from "../_shared/notify-changes.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("expected POST", { status: 405 });
  }

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) {
    return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
  }

  const { departmentId, message } = await req.json();
  if (!departmentId || !message) {
    return Response.json({ error: "expected { departmentId, message }" }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const notified = await notifyDepartmentSubscribers(supabase, token, departmentId, message);
  return Response.json({ notified });
});
