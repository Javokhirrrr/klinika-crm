// src/controllers/bots.controller.js
import crypto from 'crypto';
import axios from 'axios';

import { env } from '../config/env.js';
import { TelegramBot } from '../models/TelegramBot.js';
import { TelegramLink } from '../models/TelegramLink.js';
import { Patient } from '../models/Patient.js';

import { tgSend, tgSendSafe, tgSetWebhook, tgDeleteWebhook } from '../lib/telegram.js';

/* ============================= UTILS ============================= */
function toE164(raw) {
  if (!raw) return '';
  // juda soddalashtirilgan normalizatsiya (+998...)
  const d = String(raw).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  // agar 998 bilan boshlangan bo‘lsa
  if (d.startsWith('998')) return `+${d}`;
  // 9-10-11 belgili holatlar — loyihaga moslab kengaytiring
  return d;
}

function webhookUrl(bot) {
  return `${env.publicUrl}/api/bot/telegram/${bot._id}/${bot.secret}`;
}

function genSecret(len = 24) {
  return crypto.randomBytes(len).toString('base64url');
}

const portalKeyboard = (role) => ({
  inline_keyboard: [[{
    text: role === "admin" ? "🔧 Admin portal" : "📲 Shaxsiy portal",
    web_app: { url: `${env.webappUrl}?role=${role}` }
  }]],
});

/* ============================= CRUD ============================== */
export const listBots = async (req, res) => {
  const items = await TelegramBot.find({ orgId: req.orgId }).sort({ createdAt: -1 }).lean();
  res.json({ items });
};

export const createBot = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ message: 'Token kerak!' });

  // 1) Tokenni tekshirish
  let me;
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (!data?.ok) return res.status(400).json({ message: 'Invalid token' });
    me = data.result;
  } catch (e) {
    return res.status(400).json({ message: 'Telegram bilan aloqa xatosi (getMe).' });
  }

  // 2) Bazaga yozish
  const secret = genSecret();
  const bot = await TelegramBot.create({
    orgId: req.orgId,
    token,
    name: me?.first_name || '',
    username: me?.username || '',
    secret,
    adminsPhones: [],
    flags: {},
    isActive: true,
  });

  // 3) Webhook o‘rnatish
  const url = webhookUrl(bot);
  try {
    await tgSetWebhook(token, url);
    await TelegramBot.updateOne({ _id: bot._id }, { $set: { webhookUrl: url } });
    const fresh = await TelegramBot.findById(bot._id).lean();
    res.status(201).json(fresh);
  } catch (e) {
    await TelegramBot.updateOne(
      { _id: bot._id },
      { $set: { webhookUrl: url, isActive: false, lastError: String(e?.message || e) } }
    );
    res.status(400).json({
      message:
        "Webhook o‘rnashmadi. PUBLIC_URL HTTPS bo‘lishi kerak (cloudflared/ngrok). Xato: " +
        (e?.response?.data?.description || e?.message || "Telegram API error"),
    });
  }
};

export const updateBot = async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const upd = {};

  if (Array.isArray(b.adminsPhones)) {
    upd.adminsPhones = b.adminsPhones.map(toE164).filter(Boolean);
  }
  if (b.flags) {
    upd.flags = {
      notifyAppointment: !!b.flags.notifyAppointment,
      notifyPayment: !!b.flags.notifyPayment,
      notifyExpense: !!b.flags.notifyExpense,
      notifyDebtChange: !!b.flags.notifyDebtChange,
    };
  }

  const updated = await TelegramBot.findOneAndUpdate(
    { _id: id, orgId: req.orgId },
    { $set: upd },
    { new: true, lean: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
};

export const deleteBot = async (req, res) => {
  const { id } = req.params;

  const bot = await TelegramBot.findOne({ _id: id, orgId: req.orgId });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  try { await tgDeleteWebhook(bot.token); } catch {}
  await TelegramBot.deleteOne({ _id: bot._id });
  await TelegramLink.deleteMany({ orgId: req.orgId, botId: bot._id });

  res.json({ ok: true });
};

/* ============================== TEST ============================= */
export const testBot = async (req, res) => {
  const { id } = req.params;
  const phoneRaw = req.body?.phone || '';
  const chatIdRaw = req.body?.chatId ? String(req.body.chatId) : '';

  const bot = await TelegramBot.findOne({ _id: id, orgId: req.orgId }).lean();
  if (!bot) return res.status(404).json({ message: 'Bot topilmadi' });

  let chatId = chatIdRaw;
  if (!chatId) {
    const phone = toE164(phoneRaw);
    if (!phone) return res.status(400).json({ message: 'Telefon noto‘g‘ri' });
    const link = await TelegramLink.findOne({ orgId: req.orgId, botId: bot._id, phone }).lean();
    if (!link) return res.status(404).json({ message: 'User linked emas. Botda /start → telefonni ulashsin.' });
    chatId = link.chatId;
  }

  const r = await tgSendSafe(bot.token, 'sendMessage', {
    chat_id: chatId,
    text: req.body?.message || 'Bot ishlayapti ✅',
  });
  if (!r) return res.status(500).json({ message: 'Xabar yuborilmadi (user bloklagan bo‘lishi mumkin)' });
  res.json({ ok: true });
};

/* ============================ WEBHOOK ============================ */
export const telegramWebhook = async (req, res) => {
  const { id, secret } = req.params;

  const bot = await TelegramBot.findOne({ _id: id }).lean();
  if (!bot || bot.secret !== secret) return res.sendStatus(403);

  const upd = req.body;
  const msg = upd?.message;
  if (!msg) return res.json({ ok: true });

  const chatId = String(msg.chat?.id || '');
  const text   = msg.text || '';
  const contact = msg.contact;

  // 1) /start → kontakt so‘rash
  if (/^\/start/i.test(text)) {
    await tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: "Assalomu alaykum! Telefon raqamingizni ulab oling (tugmani bosing):",
      reply_markup: {
        keyboard: [[{ text: "📱 Telefonni ulashish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return res.json({ ok: true });
  }

  // 2) Kontakt kelsa — bog‘lash, rol va tugma
  if (contact?.phone_number) {
    const phone = toE164(contact.phone_number);
    if (phone) {
      const isAdmin = Array.isArray(bot.adminsPhones) && bot.adminsPhones.includes(phone);

      const patient = await Patient.findOne({ orgId: bot.orgId, phone })
        .select('_id firstName lastName')
        .lean();

      await TelegramLink.findOneAndUpdate(
        { orgId: bot.orgId, botId: bot._id, chatId },
        { $set: { phone, isAdmin, patientId: patient?._id } },
        { upsert: true }
      );

      // klaviaturani yopamiz
      await tgSendSafe(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: "✅ Telefon ulandi.",
        reply_markup: { remove_keyboard: true },
      });

      if (isAdmin) {
        await tgSendSafe(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: "Admin sifatida tasdiqlandingiz. Pastdagi tugma orqali portaldan foydalaning:",
          reply_markup: portalKeyboard('admin'),
        });
      } else if (patient?._id) {
        await tgSendSafe(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: "Shaxsiy portalga kirish uchun tugmani bosing:",
          reply_markup: portalKeyboard('patient'),
        });
      } else {
        await tgSendSafe(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: "Bu raqam bazada topilmadi. Avval klinika tizimida bemor sifatida ro‘yxatdan o‘tkazing.",
        });
      }
      return res.json({ ok: true });
    }
  }

  // 3) Boshqa xabarlar
  await tgSendSafe(bot.token, 'sendMessage', {
    chat_id: chatId,
    text: "☎️ Iltimos, /start bosing va telefonni ulashing.",
  });
  res.json({ ok: true });
};

/* ============================ HELPERS ============================= */
async function getActiveBot(orgId) {
  return TelegramBot.findOne({ orgId, isActive: true }).lean();
}

export async function notifyAdminsByBot(orgId, text) {
  const bot = await getActiveBot(orgId);
  if (!bot) return;

  const links = await TelegramLink.find({ orgId, botId: bot._id, isAdmin: true }).lean();
  await Promise.all(
    links.map((l) => tgSendSafe(bot.token, 'sendMessage', { chat_id: l.chatId, text }))
  );
}

export async function notifyPatientByBot(orgId, patientId, text) {
  const bot = await getActiveBot(orgId);
  if (!bot) return;

  let link = await TelegramLink.findOne({ orgId, botId: bot._id, patientId }).lean();
  if (!link) {
    const p = await Patient.findOne({ _id: patientId, orgId }).lean();
    if (!p?.phone) return;
    link = await TelegramLink.findOne({ orgId, botId: bot._id, phone: toE164(p.phone) }).lean();
    if (!link) return;
  }
  await tgSendSafe(bot.token, 'sendMessage', { chat_id: link.chatId, text });
}
