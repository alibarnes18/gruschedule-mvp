import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { sendMessage } from "./telegram.ts";

/** Sends `message` to every Telegram chat subscribed to `departmentId`.
 * Returns how many chats were notified. */
export async function notifyDepartmentSubscribers(
  supabase: SupabaseClient,
  token: string,
  departmentId: string,
  message: string,
): Promise<number> {
  const { data: subs } = await supabase
    .from("notification_subscriptions")
    .select("telegram_chat_id")
    .eq("department_id", departmentId);

  for (const sub of subs ?? []) {
    await sendMessage(token, Number(sub.telegram_chat_id), message);
  }
  return subs?.length ?? 0;
}
