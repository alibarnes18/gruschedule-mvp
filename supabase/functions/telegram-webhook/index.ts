// Telegram webhook (spec.md section 6). Registered once, manually, with:
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<this function's URL>"
//
// Commands: /start, /bolum_sec, /sinavlarim, /menu, /takvim, /simdi, /programim.
// /bolum_sec drives an inline-keyboard faculty -> department -> şube flow
// that upserts notification_subscriptions, keyed by telegram_chat_id.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleTelegramUpdate } from "../_shared/bot-commands.ts";
import type { TelegramUpdate } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("expected POST", { status: 405 });
  }

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return new Response("ok"); // ack anyway — Telegram retries on non-2xx
  }

  const update: TelegramUpdate = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    await handleTelegramUpdate(supabase, token, update);
  } catch (error) {
    console.error("telegram-webhook error", error);
  }

  // Always ack with 200 — Telegram redelivers the same update otherwise.
  return new Response("ok");
});
