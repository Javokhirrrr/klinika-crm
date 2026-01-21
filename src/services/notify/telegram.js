// src/services/notify/telegram.js
import { env } from '../../config/env.js';

// .env dan olinadigan konfiguratsiyalar
const BOT = env.telegramBotToken;                 // TELEGRAM_BOT_TOKEN
const DEFAULT_CHAT = env.telegramDefaultChatId    // TELEGRAM_DEFAULT_CHAT_ID (ixtiyoriy)
  || env.telegramCashierChatId                   // TELEGRAM_CASHIER_CHAT_ID (fallback)
  || null;

/**
 * Telegramga matn yuborish
 * @param {Object} p
 * @param {string} [p.chatId]  - Ko'rsatilmasa DEFAULT_CHAT ishlatiladi
 * @param {string} p.text
 * @param {string} [p.parseMode='HTML']
 * @returns {Promise<{ok:boolean, data?:any, status?:number, error?:string}>}
 */
export async function sendTelegram({ chatId, text, parseMode = 'HTML' }) {
  const to = chatId || DEFAULT_CHAT;

  if (!BOT) return { ok: false, error: 'missing-bot-token' };
  if (!to) return { ok: false, error: 'missing-chat-id' };
  if (!text) return { ok: false, error: 'missing-text' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: to, text, parse_mode: parseMode }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, status: res.status, data };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || 'tg-request-error' };
  }
}

/** Kassirga tezkor xabar yuborish (CHAT ID env dan olinadi) */
export const notifyCashier = (text) =>
  sendTelegram({ chatId: env.telegramCashierChatId, text });

export default { sendTelegram, notifyCashier };
