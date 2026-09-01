import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  answerCallbackQuery,
  editMessageReplyMarkup,
  sendMessage,
  type InlineKeyboard,
  type TelegramUpdate,
} from "./telegram.ts";
import {
  currentDbDay,
  currentTimeString,
  DAY_NAMES,
  EXAM_TYPE_LABELS,
  formatDate,
  formatTime,
  nowInIstanbul,
  sectionLabel,
} from "./tr-format.ts";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5];

async function getSubscription(supabase: SupabaseClient, chatId: number) {
  const { data } = await supabase
    .from("notification_subscriptions")
    .select("department_id, section_id")
    .eq("telegram_chat_id", String(chatId))
    .maybeSingle();
  return data;
}

async function sendFacultyMenu(supabase: SupabaseClient, token: string, chatId: number) {
  const { data: faculties } = await supabase.from("faculties").select("id, name").order("name");
  const keyboard: InlineKeyboard = (faculties ?? []).map((f) => [{ text: f.name, callback_data: `fac:${f.id}` }]);
  await sendMessage(token, chatId, "Fakültenizi seçin:", keyboard);
}

async function sendDepartmentMenu(
  supabase: SupabaseClient,
  token: string,
  chatId: number,
  messageId: number | undefined,
  facultyId: string,
) {
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("faculty_id", facultyId)
    .order("name");
  const keyboard: InlineKeyboard = (departments ?? []).map((d) => [{ text: d.name, callback_data: `dep:${d.id}` }]);
  const text = "Bölümünüzü seçin:";
  if (messageId) await editMessageReplyMarkup(token, chatId, messageId, text, keyboard);
  else await sendMessage(token, chatId, text, keyboard);
}

async function sendSectionMenuOrFinish(
  supabase: SupabaseClient,
  token: string,
  chatId: number,
  messageId: number | undefined,
  departmentId: string,
) {
  const { data: sections } = await supabase
    .from("sections")
    .select("id, grade_level, section_label")
    .eq("department_id", departmentId)
    .order("grade_level");

  if (!sections || sections.length === 0) {
    await upsertSubscription(supabase, chatId, departmentId, null);
    const text = "Bölümünüz kaydedildi. /sinavlarim, /menu ve /takvim komutlarını kullanabilirsiniz.";
    if (messageId) await editMessageReplyMarkup(token, chatId, messageId, text);
    else await sendMessage(token, chatId, text);
    return;
  }

  const keyboard: InlineKeyboard = sections.map((s) => [
    { text: sectionLabel(s.grade_level, s.section_label), callback_data: `sec:${s.id}` },
  ]);
  const text = "Sınıf/şubenizi seçin:";
  if (messageId) await editMessageReplyMarkup(token, chatId, messageId, text, keyboard);
  else await sendMessage(token, chatId, text, keyboard);
}

async function upsertSubscription(
  supabase: SupabaseClient,
  chatId: number,
  departmentId: string,
  sectionId: string | null,
) {
  await supabase
    .from("notification_subscriptions")
    .upsert(
      { telegram_chat_id: String(chatId), department_id: departmentId, section_id: sectionId },
      { onConflict: "telegram_chat_id" },
    );
}

async function finishSectionSelection(
  supabase: SupabaseClient,
  token: string,
  chatId: number,
  messageId: number | undefined,
  sectionId: string,
) {
  const { data: section } = await supabase
    .from("sections")
    .select("department_id")
    .eq("id", sectionId)
    .single();
  if (!section) return;

  await upsertSubscription(supabase, chatId, section.department_id, sectionId);
  const text = "Şubeniz kaydedildi. /simdi, /programim, /sinavlarim, /menu ve /takvim komutlarını kullanabilirsiniz.";
  if (messageId) await editMessageReplyMarkup(token, chatId, messageId, text);
  else await sendMessage(token, chatId, text);
}

async function handleSinavlarim(supabase: SupabaseClient, token: string, chatId: number) {
  const sub = await getSubscription(supabase, chatId);
  if (!sub) {
    await sendMessage(token, chatId, "Önce /bolum_sec ile bölümünüzü seçin.");
    return;
  }

  const today = nowInIstanbul().toISOString().slice(0, 10);
  const { data: exams } = await supabase
    .from("exam_events")
    .select("course_name, exam_type, exam_date, exam_time")
    .eq("department_id", sub.department_id)
    .gte("exam_date", today)
    .order("exam_date")
    .limit(10);

  if (!exams || exams.length === 0) {
    await sendMessage(token, chatId, "Yaklaşan sınav bulunamadı.");
    return;
  }

  const lines = exams.map(
    (e) =>
      `• <b>${e.course_name}</b> — ${EXAM_TYPE_LABELS[e.exam_type] ?? e.exam_type}, ${formatDate(e.exam_date)}` +
      (e.exam_time ? ` ${formatTime(e.exam_time)}` : ""),
  );
  await sendMessage(token, chatId, lines.join("\n"));
}

async function handleMenu(supabase: SupabaseClient, token: string, chatId: number) {
  const today = nowInIstanbul().toISOString().slice(0, 10);
  const { data: menu } = await supabase.from("menu_days").select("items").eq("date", today).maybeSingle();
  if (!menu) {
    await sendMessage(token, chatId, "Bugün için menü bilgisi bulunamadı.");
    return;
  }
  await sendMessage(token, chatId, menu.items.map((i: string) => `• ${i}`).join("\n"));
}

async function handleTakvim(supabase: SupabaseClient, token: string, chatId: number) {
  const today = nowInIstanbul().toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("academic_calendar_events")
    .select("title, start_date, end_date")
    .gte("start_date", today)
    .order("start_date")
    .limit(5);

  if (!events || events.length === 0) {
    await sendMessage(token, chatId, "Yaklaşan bir akademik takvim etkinliği yok.");
    return;
  }

  const lines = events.map((e) => `• <b>${e.title}</b> — ${formatDate(e.start_date)}`);
  await sendMessage(token, chatId, lines.join("\n"));
}

async function handleSimdi(supabase: SupabaseClient, token: string, chatId: number) {
  const sub = await getSubscription(supabase, chatId);
  if (!sub?.section_id) {
    await sendMessage(token, chatId, "Önce /bolum_sec ile şubenizi seçin.");
    return;
  }

  const now = nowInIstanbul();
  const day = currentDbDay(now);
  const time = currentTimeString(now);

  const { data: entries } = await supabase
    .from("class_schedule_entries")
    .select("course_name, day_of_week, start_time, end_time, location")
    .eq("section_id", sub.section_id);

  const todays = (entries ?? [])
    .filter((e) => e.day_of_week === day)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const current = todays.find((e) => e.start_time <= time && time < e.end_time);
  if (current) {
    await sendMessage(
      token,
      chatId,
      `Şu an <b>${current.course_name}</b> dersindesiniz${current.location ? ` (${current.location})` : ""}.`,
    );
    return;
  }

  const next = todays.find((e) => e.end_time > time);
  if (next) {
    await sendMessage(
      token,
      chatId,
      `Şu an dersiniz yok. Sıradaki ders: <b>${next.course_name}</b>, ${formatTime(next.start_time)}` +
        (next.location ? ` (${next.location})` : ""),
    );
    return;
  }

  await sendMessage(token, chatId, "Bugün için dersiniz kalmadı.");
}

async function handleProgramim(supabase: SupabaseClient, token: string, chatId: number) {
  const sub = await getSubscription(supabase, chatId);
  if (!sub?.section_id) {
    await sendMessage(token, chatId, "Önce /bolum_sec ile şubenizi seçin.");
    return;
  }

  const { data: entries } = await supabase
    .from("class_schedule_entries")
    .select("course_name, day_of_week, start_time, end_time, location")
    .eq("section_id", sub.section_id)
    .order("day_of_week")
    .order("start_time");

  if (!entries || entries.length === 0) {
    await sendMessage(token, chatId, "Şubeniz için ders programı bulunamadı.");
    return;
  }

  const lines: string[] = [];
  for (const day of WEEKDAY_ORDER) {
    const dayEntries = entries.filter((e) => e.day_of_week === day);
    if (dayEntries.length === 0) continue;
    lines.push(`<b>${DAY_NAMES[day]}</b>`);
    for (const e of dayEntries) {
      lines.push(`  ${formatTime(e.start_time)}–${formatTime(e.end_time)} ${e.course_name}${e.location ? ` (${e.location})` : ""}`);
    }
  }
  await sendMessage(token, chatId, lines.join("\n"));
}

async function handleCommand(supabase: SupabaseClient, token: string, chatId: number, text: string) {
  const command = text.trim().split(/\s+/)[0].toLowerCase();
  switch (command) {
    case "/start":
      await sendMessage(
        token,
        chatId,
        "Gruschedule'a hoş geldiniz! Ders programı, sınav takvimi, akademik takvim ve yemekhane menüsü bilgilerine buradan ulaşabilirsiniz.",
      );
      await sendFacultyMenu(supabase, token, chatId);
      return;
    case "/bolum_sec":
      await sendFacultyMenu(supabase, token, chatId);
      return;
    case "/sinavlarim":
      await handleSinavlarim(supabase, token, chatId);
      return;
    case "/menu":
      await handleMenu(supabase, token, chatId);
      return;
    case "/takvim":
      await handleTakvim(supabase, token, chatId);
      return;
    case "/simdi":
      await handleSimdi(supabase, token, chatId);
      return;
    case "/programim":
      await handleProgramim(supabase, token, chatId);
      return;
    default:
      await sendMessage(token, chatId, "Anlaşılamayan komut. /start ile başlayabilirsiniz.");
  }
}

async function handleCallbackQuery(
  supabase: SupabaseClient,
  token: string,
  update: NonNullable<TelegramUpdate["callback_query"]>,
) {
  await answerCallbackQuery(token, update.id);
  const chatId = update.message?.chat.id;
  const messageId = update.message?.message_id;
  const data = update.data;
  if (!chatId || !data) return;

  const [kind, id] = data.split(":");
  if (kind === "fac") await sendDepartmentMenu(supabase, token, chatId, messageId, id);
  else if (kind === "dep") await sendSectionMenuOrFinish(supabase, token, chatId, messageId, id);
  else if (kind === "sec") await finishSectionSelection(supabase, token, chatId, messageId, id);
}

export async function handleTelegramUpdate(
  supabase: SupabaseClient,
  token: string,
  update: TelegramUpdate,
): Promise<void> {
  if (update.callback_query) {
    await handleCallbackQuery(supabase, token, update.callback_query);
    return;
  }
  if (update.message?.text) {
    await handleCommand(supabase, token, update.message.chat.id, update.message.text);
  }
}
