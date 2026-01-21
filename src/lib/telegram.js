// src/lib/telegram.js
import axios from "axios";

export async function tgApi(botToken, method, payload) {
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  const { data } = await axios.post(url, payload);
  if (!data?.ok) {
    throw new Error(data?.description || "Telegram API error");
  }
  return data.result;
}

export const tgGetMe = (botToken) => tgApi(botToken, "getMe", {});
export const tgSendMessage = (botToken, chatId, text, extra = {}) =>
  tgApi(botToken, "sendMessage", { chat_id: chatId, text, ...extra });

export function webAppKeyboard(url, text = "Open portal") {
  return { inline_keyboard: [[{ text, web_app: { url } }]] };
}

export const tgSendWebAppButton = (botToken, chatId, url, text = "Open portal") =>
  tgSendMessage(botToken, chatId, "📲 Portalni ochish", {
    reply_markup: webAppKeyboard(url, text),
  });

export async function tgSend(token, method, payload) {
  const { data } = await axios.post(`https://api.telegram.org/bot${token}/${method}`, payload);
  if (!data?.ok) throw new Error(data?.description || "Telegram API error");
  return data.result;
}

// ✅ YANGI: xatolarni yutib yuboradigan xavfsiz yuborish
export async function tgSendSafe(token, method, payload) {
  try {
    return await tgSend(token, method, payload);
  } catch (e) {
    const desc = e?.response?.data?.description || e?.message || String(e);
    // foydalanuvchi bloklagan / chat not found va hokazo — fatal emas
    if (/blocked by the user|user is deactivated|chat not found|have no rights/i.test(desc)) {
      console.warn("tgSendSafe: skipped non-fatal:", desc, "chat:", payload?.chat_id);
      return null;
    }
    console.error("tgSendSafe error:", desc);
    return null;
  }
}

export async function tgSetWebhook(token, url) {
  return tgSend(token, "setWebhook", { url, allowed_updates: ["message"] });
}

export async function tgDeleteWebhook(token) {
  return tgSend(token, "deleteWebhook", {});
}
