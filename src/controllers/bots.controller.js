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
  const d = String(raw).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('998')) return `+${d}`;
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

  let me;
  try {
    const { data } = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (!data?.ok) return res.status(400).json({ message: 'Invalid token' });
    me = data.result;
  } catch (e) {
    return res.status(400).json({ message: 'Telegram bilan aloqa xatosi (getMe).' });
  }

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
        "Webhook o'rnashmadi. PUBLIC_URL HTTPS bo'lishi kerak. Xato: " +
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

  try { await tgDeleteWebhook(bot.token); } catch { }
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
    if (!phone) return res.status(400).json({ message: "Telefon noto'g'ri" });
    const link = await TelegramLink.findOne({ orgId: req.orgId, botId: bot._id, phone }).lean();
    if (!link) return res.status(404).json({ message: 'User linked emas. Botda /start → telefonni ulashsin.' });
    chatId = link.chatId;
  }

  const r = await tgSendSafe(bot.token, 'sendMessage', {
    chat_id: chatId,
    text: req.body?.message || 'Bot ishlayapti ✅',
  });
  if (!r) return res.status(500).json({ message: 'Xabar yuborilmadi (user bloklagan bo\'lishi mumkin)' });
  res.json({ ok: true });
};

/* ============================ WEBHOOK ============================ */
export const telegramWebhook = async (req, res) => {
  const { id, secret } = req.params;

  const bot = await TelegramBot.findOne({ _id: id }).lean();
  if (!bot || bot.secret !== secret) return res.sendStatus(403);

  const upd = req.body;

  // ─── Callback query (inline tugmalar) ─────────────────────────
  if (upd?.callback_query) {
    const query = upd.callback_query;
    const chatId = String(query.message?.chat?.id || '');
    const data = query.data || '';

    // Telegram ga callback ack
    await tgSendSafe(bot.token, 'answerCallbackQuery', { callback_query_id: query.id });

    if (data === 'my_card') {
      await sendPatientCard(bot, chatId);
    } else if (data === 'my_appts') {
      await sendMyAppointments(bot, chatId);
    } else if (data === 'main_menu') {
      const link = await TelegramLink.findOne({ botId: bot._id, chatId }).lean();
      const pat = link?.patientId
        ? await Patient.findById(link.patientId).select('firstName').lean()
        : null;
      await sendMainMenu(bot.token, chatId, pat);
    }
    return res.json({ ok: true });
  }

  const msg = upd?.message;
  if (!msg) return res.json({ ok: true });

  const chatId = String(msg.chat?.id || '');
  const text = (msg.text || '').trim();
  const contact = msg.contact;

  // 1) /start → kontakt so'rash
  if (/^\/start/i.test(text)) {
    await tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: '🏥 <b>Klinika botiga xush kelibsiz!</b>\n\nTelefon raqamingizni ulang:',
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [[{ text: '📱 Telefonni ulashish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return res.json({ ok: true });
  }

  // 2) /profil yoki /karta komandasi
  if (/^\/(profil|karta|card|profile)/i.test(text)) {
    await sendPatientCard(bot, chatId);
    return res.json({ ok: true });
  }

  // 3) Kontakt kelsa — bog'lash + menu
  if (contact?.phone_number) {
    const phone = toE164(contact.phone_number);
    if (phone) {
      const isAdmin = Array.isArray(bot.adminsPhones) && bot.adminsPhones.includes(phone);

      const patient = await Patient.findOne({ orgId: bot.orgId, phone })
        .select('_id firstName lastName cardNo phone birthDate gender address bloodType createdAt')
        .lean();

      await TelegramLink.findOneAndUpdate(
        { orgId: bot.orgId, botId: bot._id, chatId },
        { $set: { phone, isAdmin, patientId: patient?._id } },
        { upsert: true }
      );

      await tgSendSafe(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: patient
          ? `✅ <b>Tasdiqlandi!</b>\n\nSalom, <b>${patient.firstName} ${patient.lastName || ''}</b>!`
          : '✅ Telefon ulandi.',
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true },
      });

      if (isAdmin) {
        await tgSendSafe(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: 'Admin sifatida tasdiqlandingiz:',
          reply_markup: portalKeyboard('admin'),
        });
      } else if (patient?._id) {
        await sendMainMenu(bot.token, chatId, patient);
      } else {
        await tgSendSafe(bot.token, 'sendMessage', {
          chat_id: chatId,
          text: "❌ Bu raqam bazada topilmadi. Klinikaga murojaat qiling.",
        });
      }
      return res.json({ ok: true });
    }
  }

  // 4) Boshqa xabar — ro'yxatdan o'tgan bo'lsa menuni ko'rsat
  const link = await TelegramLink.findOne({ orgId: bot.orgId, botId: bot._id, chatId }).lean();
  if (link?.patientId) {
    const pat = await Patient.findById(link.patientId).select('firstName').lean();
    await sendMainMenu(bot.token, chatId, pat);
  } else {
    await tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: '☎️ /start bosing va telefonni ulashing.',
    });
  }
  res.json({ ok: true });
};

/* ─── Bemor kartasini yuborish ─────────────────────────────────── */
async function sendPatientCard(bot, chatId) {
  const link = await TelegramLink.findOne({ botId: bot._id, chatId }).lean();
  if (!link?.patientId) {
    return tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: "❌ Siz hali ro'yxatdan o'tmagansiz. /start bosing.",
    });
  }

  const patient = await Patient.findById(link.patientId).lean();
  if (!patient) {
    return tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: '❌ Bemor topilmadi.',
    });
  }

  // Yosh
  let age = '';
  if (patient.birthDate) {
    const yil = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
    age = `${yil} yosh`;
  }

  const genderLabel = patient.gender === 'male'
    ? '👨 Erkak'
    : patient.gender === 'female' ? '👩 Ayol' : '';

  const regDate = patient.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('uz-UZ')
    : '—';

  // Bemor kartasi (chiroyli formatda)
  const rows = [
    `╔══════════════════════╗`,
    `║  🏥  BEMOR KARTASI   ║`,
    `╚══════════════════════╝`,
    ``,
    `👤 <b>${patient.firstName} ${patient.lastName || ''}</b>`,
  ];

  if (patient.cardNo) rows.push(`🎫 Karta №: <code>${patient.cardNo}</code>`);
  if (patient.phone) rows.push(`📞 Telefon: <code>${patient.phone}</code>`);
  if (age) rows.push(`🎂 Yosh: ${age}`);
  if (genderLabel) rows.push(`⚧  Jins: ${genderLabel}`);
  if (patient.address) rows.push(`📍 Manzil: ${patient.address}`);
  if (patient.bloodType) rows.push(`🩸 Qon guruhi: <b>${patient.bloodType}</b>`);

  rows.push(``);
  rows.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  rows.push(`📅 Ro'yxatga olingan: ${regDate}`);
  rows.push(``);
  rows.push(`<i>ℹ️ Ushbu karta ma'lumot uchun.</i>`);

  await tgSendSafe(bot.token, 'sendMessage', {
    chat_id: chatId,
    text: rows.join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📅 Qabullarim', callback_data: 'my_appts' },
          { text: '🔄 Yangilash', callback_data: 'my_card' },
        ],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ]
    }
  });
}

/* ─── Qabullarim ────────────────────────────────────────────────── */
async function sendMyAppointments(bot, chatId) {
  const link = await TelegramLink.findOne({ botId: bot._id, chatId }).lean();
  if (!link?.patientId) return;

  try {
    const { Appointment } = await import('../models/Appointment.js');
    const apts = await Appointment.find({
      orgId: bot.orgId,
      patientId: link.patientId,
      isDeleted: { $ne: true },
      startAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
      .sort({ startAt: 1 })
      .limit(5)
      .populate('doctorId', 'firstName lastName')
      .lean();

    if (!apts.length) {
      return tgSendSafe(bot.token, 'sendMessage', {
        chat_id: chatId,
        text: '📅 Oxirgi 30 kunda qabul topilmadi.',
      });
    }

    const st = {
      scheduled: '📋 Rejalashtirilgan',
      waiting: '⏳ Kutmoqda',
      in_progress: '🩺 Jarayonda',
      done: '✅ Tugallangan',
      cancelled: '❌ Bekor'
    };

    let txt = `📅 <b>Qabullarim (${apts.length} ta):</b>\n\n`;
    apts.forEach((a, i) => {
      const dt = a.startAt
        ? new Date(a.startAt).toLocaleString('uz-UZ', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
        : a.date || '—';
      const doc = a.doctorId
        ? `Dr. ${a.doctorId.firstName} ${a.doctorId.lastName || ''}`
        : '—';
      txt += `${i + 1}. <b>${dt}</b>\n👨‍⚕️ ${doc}\n${st[a.status] || a.status}\n\n`;
    });

    await tgSendSafe(bot.token, 'sendMessage', {
      chat_id: chatId,
      text: txt,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]]
      }
    });
  } catch (e) {
    console.error('sendMyAppointments error:', e);
  }
}

/* ─── Asosiy menyu ──────────────────────────────────────────────── */
async function sendMainMenu(token, chatId, patient) {
  await tgSendSafe(token, 'sendMessage', {
    chat_id: chatId,
    text: `🏥 <b>Asosiy Menyu</b>\n\nSalom, <b>${patient?.firstName || 'Bemor'}</b>!\nQuyidagilardan birini tanlang:`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '👤 Bemor Kartam', callback_data: 'my_card' }],
        [{ text: '📅 Qabullarim', callback_data: 'my_appts' }],
      ]
    }
  });
}

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

/* ============================ BROADCAST =========================== */
export const broadcastMessage = async (req, res) => {
  const { id } = req.params;
  const message = String(req.body?.message || '').trim();

  if (!message) return res.status(400).json({ message: 'Xabar matni kiritilmagan' });

  const bot = await TelegramBot.findOne({ _id: id, orgId: req.orgId }).lean();
  if (!bot) return res.status(404).json({ message: 'Bot topilmadi' });

  const links = await TelegramLink.find({ orgId: req.orgId, botId: bot._id }).lean();
  if (!links.length) return res.json({ ok: true, sent: 0, failed: 0 });

  let sent = 0, failed = 0;
  await Promise.all(
    links.map(async (l) => {
      const ok = await tgSendSafe(bot.token, 'sendMessage', {
        chat_id: l.chatId,
        text: message,
        parse_mode: 'Markdown',
      });
      if (ok) sent++; else failed++;
    })
  );

  res.json({ ok: true, sent, failed, total: links.length });
};

/* ============================= NOTIFY PATIENT ============================= */
/**
 * notifyPatientByBot
 * patientId bo'yicha bemorning barcha Telegram chatlarini topib xabar yuboradi.
 * appointments.controller.js va boshqa controllerlar tomonidan chaqiriladi.
 */
export async function notifyPatientByBot(orgId, patientId, message) {
  try {
    // Ushbu orgga tegishli barcha aktiv botlarni topamiz
    const bots = await TelegramBot.find({ orgId, isActive: true }).lean();
    if (!bots.length) {
      console.log('[notify] Aktiv bot topilmadi, orgId:', orgId);
      return { sent: 0, reason: 'no_bot' };
    }

    // Patientning Telegram link (chatId) lari
    const links = await TelegramLink.find({
      patientId,
      isVerified: true,
    }).lean();

    if (!links.length) {
      console.log('[notify] Bemor Telegram ga ulanmagan, patientId:', patientId);
      return { sent: 0, reason: 'no_link' };
    }

    let sent = 0;
    for (const bot of bots) {
      for (const link of links) {
        try {
          const ok = await tgSendSafe(bot.token, 'sendMessage', {
            chat_id: link.chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
          });
          if (ok) sent++;
        } catch (e) {
          console.warn('[notify] sendMessage failed:', e.message);
        }
      }
    }
    console.log(`[notify] Yuborildi: ${sent}/${links.length}`);
    return { sent };
  } catch (e) {
    console.error('[notify] notifyPatientByBot error:', e.message);
    return { sent: 0, error: e.message };
  }
}
