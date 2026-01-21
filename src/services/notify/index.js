// src/services/notify/index.js
import { sendTelegram, notifyCashier } from './telegram.js';
import { sendSMS } from './sms.js';

// Re-exports
export { sendTelegram, notifyCashier } from './telegram.js';

/**
 * Universal xabarnoma yuboruvchi:
 * - Telegram (agar patient.telegramChatId yoki default chat mavjud bo'lsa)
 * - SMS (agar .env da SMS_API_KEY, SMS_SENDER bor bo'lsa va raqam ko'rsatilsa)
 *
 * @param {Object} p
 * @param {Object} [p.patient]          - { telegramChatId?, phone? }
 * @param {string} p.text               - xabar matni
 * @param {string} [p.smsTo]            - ixtiyoriy, berilsa shu raqamga SMS
 * @returns {Promise<Array<{type:'telegram'|'sms', ok:boolean, ...}>>}
 */
export async function notifyText({ patient, text, smsTo }) {
  const results = [];

  // ---- Telegram ----
  try {
    const tgRes = await sendTelegram({
      chatId: patient?.telegramChatId, // bo'lmasa default chat ishlatiladi (telegram.js ichida)
      text,
    });
    if (tgRes) results.push({ type: 'telegram', ...tgRes });
  } catch (e) {
    results.push({ type: 'telegram', ok: false, error: e?.message || 'tg-error' });
  }

  // ---- SMS ----
  try {
    const to = smsTo || patient?.phone;
    const apiKey = process.env.SMS_API_KEY;
    const sender = process.env.SMS_SENDER;

    if (apiKey && sender && to && text) {
      const smsRes = await sendSMS({ apiKey, sender, to, text });
      results.push({ type: 'sms', ...smsRes });
    }
  } catch (e) {
    results.push({ type: 'sms', ok: false, error: e?.message || 'sms-error' });
  }

  return results;
}

export default { notifyText };
