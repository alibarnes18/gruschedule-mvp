// Thin wrapper around the Telegram Bot API — https://core.telegram.org/bots/api

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export type InlineKeyboard = InlineKeyboardButton[][];

export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
}

function apiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  await fetch(apiUrl(token, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup ? { inline_keyboard: replyMarkup } : undefined,
    }),
  });
}

export async function editMessageReplyMarkup(
  token: string,
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void> {
  await fetch(apiUrl(token, "editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup ? { inline_keyboard: replyMarkup } : undefined,
    }),
  });
}

export async function answerCallbackQuery(token: string, callbackQueryId: string): Promise<void> {
  await fetch(apiUrl(token, "answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}
