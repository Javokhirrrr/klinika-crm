// Real gateway (Twilio yoki lokal) ulanmaguncha stub.
// Keyin kerak bo'lsa fetch bilan gateway'ga POST qilasiz.

export async function sendSMS({ apiKey, sender, to, text }) {
  if (!apiKey || !sender || !to || !text) {
    return { ok: false, message: 'Missing apiKey/sender/to/text' };
  }
  // TODO: bu yerda haqiqiy integratsiya bo'ladi (fetch ...).
  // Hozircha log qilib, muvaffaqiyat qaytaramiz:
  console.log('[SMS stub] ->', { to, sender, text });
  return { ok: true, message: 'queued' };
}
