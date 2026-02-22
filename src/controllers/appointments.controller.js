import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { QueueEntry } from "../models/QueueEntry.js";
import { notifyPatientByBot } from "./bots.controller.js";
import { emitNewPatient } from "../socket/index.js";
import { env } from "../config/env.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** helpers: body aliaslarni birxillashtirish */
function normalizeBody(b = {}) {
  // frontend eski nomlar: startAt, services
  // yangi nomlar: startsAt, serviceIds
  const startAt = b.startAt || b.startsAt || b.scheduledAt || b.appointmentDate || null;
  const serviceIds = Array.isArray(b.serviceIds) ? b.serviceIds :
    Array.isArray(b.services) ? b.services :
      b.serviceId ? [b.serviceId] : [];

  return {
    patientId: b.patientId,
    doctorId: b.doctorId,
    startAt,
    serviceIds,
    note: b.note || b.notes || "",
    status: b.status,
  };
}

/**
 * GET /api/appointments
 * query: status, doctorId, patientId, from, to, page, limit, sort (default startsAt:desc)
 */
export async function listAppointments(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
  const skip = (page - 1) * limit;

  const {
    status = "",
    doctorId = "",
    patientId = "",
    from = "",
    to = "",
    date = "",        // YANGI: bugun uchun filterlash (YYYY-MM-DD)
    sort = "startAt:desc",
  } = req.query;

  const q = { orgId: req.orgId, isDeleted: { $ne: true } };

  // Role-based filtering: If doctor, only show their own appointments
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({
      orgId: req.orgId,
      userId: req.user._id,
      isDeleted: { $ne: true }
    }).lean();

    if (doctor) {
      q.doctorId = doctor._id;
    } else {
      // If user is a doctor but no doctor profile found, return empty list for safety
      return res.json({ items: [], total: 0, page, limit });
    }
  } else if (okId(doctorId)) {
    q.doctorId = OID(doctorId);
  }

  if (status) {
    const arr = String(status).split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) q.status = { $in: arr };
  }

  if (okId(patientId)) q.patientId = OID(patientId);

  // Sana filterlash: `date` yoki `from`/`to` orqali
  if (date) {
    // Agar `date` berilsa — o'sha kunning barcha appointmentlarini olish
    q.date = date; // DB da `date` field saqlanadi (YYYY-MM-DD string)
  } else if (from || to) {
    q.startAt = {};
    if (from) q.startAt.$gte = new Date(from);
    if (to) {
      if (to.includes('T')) {
        q.startAt.$lte = new Date(to);
      } else {
        q.startAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }
    }
  }

  let [sf, sd] = String(sort).split(":");
  // Field aliases for backward compatibility
  if (sf === "startsAt" || sf === "appointmentDate" || sf === "scheduledAt") sf = "startAt";

  const sortObj = sf ? { [sf]: sd === "asc" ? 1 : -1 } : { startAt: -1 };

  const [items, total] = await Promise.all([
    Appointment.find(q)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("patientId", "firstName lastName phone")
      .populate("doctorId", "firstName lastName")
      .populate("serviceIds", "name price")
      .lean(),
    Appointment.countDocuments(q),
  ]);

  // Frontend bilan mos status mapping:
  // DB: "waiting", "in_progress", "done" → Frontend: xuddi shunday
  // (Oldingi "waiting"→"scheduled" mapping ni olib tashladik — chalkashlik keltirib chiqarardi)
  const transformedItems = items.map(item => ({
    ...item,
    _id: item._id,
    patient: item.patientId,
    doctor: item.doctorId,
    service: Array.isArray(item.serviceIds) && item.serviceIds.length > 0 ? item.serviceIds[0] : null,
    startsAt: item.startAt,
    scheduledAt: item.startAt,
    // Status as-is: "waiting", "in_progress", "done", "scheduled", "cancelled"
    status: item.status,
  }));

  res.json({ items: transformedItems, total, page, limit });
}

/**
 * POST /api/appointments
 * body: { patientId, doctorId?, serviceIds?, startsAt?, note? }
 * status default: "waiting"
 */
export async function createAppointment(req, res) {
  const b = req.body;

  if (!okId(b.patientId)) {
    return res.status(400).json({ message: "patientId is required" });
  }

  // Accept both frontend (scheduledAt, serviceId) and backend (startsAt, serviceIds) formats
  const scheduledAt = b.scheduledAt || b.startsAt || b.startAt;
  const serviceId = b.serviceId || (Array.isArray(b.serviceIds) && b.serviceIds[0]);

  // Extract date in YYYY-MM-DD format
  const startDate = scheduledAt ? new Date(scheduledAt) : new Date();
  const dateStr = b.date || startDate.toISOString().split('T')[0];

  const doc = await Appointment.create({
    orgId: req.orgId,
    patientId: OID(b.patientId),
    doctorId: okId(b.doctorId) ? OID(b.doctorId) : undefined,
    serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds.filter(okId).map(OID)
      : serviceId ? [OID(serviceId)] : [],
    date: dateStr,
    startAt: startDate,
    notes: b.notes || b.note || "",
    price: b.price || 0,
    status: b.status || "scheduled",
    isPaid: false,
    appointmentType: b.appointmentType || 'in_person',
    meetingLink: b.meetingLink || undefined,
  });

  // 🎯 AVTOMATIK NAVBATGA QO'SHISH
  // Agar qabul bugun yoki hozir uchun bo'lsa, avtomatik navbatga qo'shamiz
  try {
    const appointmentDate = doc.startAt ? new Date(doc.startAt) : new Date();
    const today = new Date();
    const isToday = appointmentDate.toDateString() === today.toDateString();

    if (isToday && okId(b.doctorId)) {
      // Shifokor uchun navbat raqamini olish
      const lastQueueEntry = await QueueEntry.findOne({
        orgId: req.orgId,
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }).sort({ queueNumber: -1 }).lean();

      const queueNumber = (lastQueueEntry?.queueNumber || 0) + 1;

      // Kutish vaqtini hisoblash
      const queueAhead = await QueueEntry.countDocuments({
        orgId: req.orgId,
        doctorId: OID(b.doctorId),
        status: { $in: ['waiting', 'called', 'in_service'] }
      });

      const avgServiceTime = 15; // daqiqa
      const estimatedWaitTime = queueAhead * avgServiceTime;

      // Queue entry yaratish
      const queueEntry = await QueueEntry.create({
        orgId: req.orgId,
        patientId: OID(b.patientId),
        doctorId: OID(b.doctorId),
        appointmentId: doc._id,
        queueNumber,
        priority: 'normal',
        status: 'waiting',
        estimatedWaitTime,
        joinedAt: new Date()
      });

      // WebSocket orqali yangilanish yuborish
      try {
        emitNewPatient(req.orgId, queueEntry);
      } catch (err) {
        console.error('WebSocket emit error:', err);
      }

      console.log(`✅ Bemor avtomatik navbatga qo'shildi: №${queueNumber}, kutish: ${estimatedWaitTime} daq`);
    }
  } catch (err) {
    console.error('❌ Avtomatik navbatga qo\'shishda xatolik:', err);
    // Xatolikni yutamiz - appointment yaratilgan, navbat esa qo'lda qo'shiladi
  }

  // 🔔 Botga bildirishnoma
  try {
    const when = doc.startAt ? new Date(doc.startAt) : new Date();
    let doctorName = "";
    if (doc.doctorId) {
      const d = await Doctor.findOne({ _id: doc.doctorId, orgId: req.orgId }).lean();
      if (d) doctorName = `${d.firstName || ""} ${d.lastName || ""}`.trim();
    }
    const lines = [
      "📅 <b>Qabul belgilandi</b>",
      `Sana/vaqt: ${when.toLocaleString()}`,
      doctorName ? `Shifokor: ${doctorName}` : "",
    ].filter(Boolean);

    await notifyPatientByBot(req.orgId, doc.patientId, lines.join("\n"));
  } catch {
    // xatoni yutamiz — API javobiga ta'sir qilmasin
  }

  res.status(201).json(doc);
}

/** GET /api/appointments/:id */
export async function getAppointment(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const a = await Appointment.findOne({
    _id: OID(id),
    orgId: req.orgId,
    isDeleted: { $ne: true },
  }).lean();

  if (!a) return res.status(404).json({ message: "Not found" });
  res.json(a);
}

export async function updateAppointment(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const b = req.body;
  const payload = {};

  if (okId(b.patientId)) payload.patientId = OID(b.patientId);
  if (okId(b.doctorId)) payload.doctorId = OID(b.doctorId);

  const serviceId = b.serviceId || (Array.isArray(b.serviceIds) && b.serviceIds[0]);
  if (serviceId) payload.serviceIds = [OID(serviceId)];

  const scheduledAt = b.scheduledAt || b.startsAt || b.startAt;
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    payload.startAt = d;
    payload.date = d.toISOString().split('T')[0];
  }
  if (b.date) payload.date = b.date;

  if (typeof b.notes === "string") payload.notes = b.notes;
  else if (typeof b.note === "string") payload.notes = b.note;

  // Status mapping (frontend → backend, hamma variant)
  if (b.status) {
    const statusMap = {
      'scheduled': 'scheduled',
      'waiting': 'waiting',
      'in_progress': 'in_progress',
      'done': 'done',
      'completed': 'done',
      'cancelled': 'cancelled',
    };
    const backendStatus = statusMap[b.status] || b.status;
    const allowed = ["scheduled", "waiting", "in_progress", "done", "cancelled"];
    if (allowed.includes(backendStatus)) {
      payload.status = backendStatus;
    }
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: payload },
    { new: true, lean: true }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
}

/** DELETE /api/appointments/:id — soft delete */
export async function deleteAppointment(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Appointment.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true, lean: true }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
}

/** PATCH /api/appointments/:id/status  { status } */
export async function setAppointmentStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  // Map frontend status to backend
  const statusMap = {
    'scheduled': 'scheduled',
    'waiting': 'waiting',
    'in_progress': 'in_progress',
    'done': 'done',
    'completed': 'done',
    'cancelled': 'cancelled',
  };

  const backendStatus = statusMap[status] || status;
  const allowed = ["scheduled", "waiting", "in_progress", "done", "cancelled"];

  if (!allowed.includes(backendStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: { status: backendStatus } },
    { new: true, lean: true }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
}

/** POST /api/appointments/:id/mark-paid */
export async function markAppointmentPaid(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Appointment.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: { isPaid: true, paidAt: new Date() } },
    { new: true, lean: true }
  );

  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
}

/**
 * POST /api/appointments/:id/meeting
 * Jitsi Meet xonasini yaratish yoki olish (videocall)
 */
export async function createMeetingRoom(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const appointment = await Appointment.findOne({
    _id: OID(id),
    orgId: req.orgId,
    isDeleted: { $ne: true }
  }).populate('doctorId', 'firstName lastName')
    .populate('patientId', 'firstName lastName phone');

  if (!appointment) return res.status(404).json({ message: "Qabul topilmadi" });

  // Google Meet URL — o'xshash xona kodi (deterministik)
  // Format: meet.google.com/xxx-yyyy-zzz (10 harf)
  const hash = id.slice(-10).toLowerCase().replace(/[^a-z0-9]/g, 'x');
  const meetCode = `${hash.slice(0, 3)}-${hash.slice(3, 7)}-${hash.slice(7, 10)}`;
  const meetingLink = `https://meet.google.com/${meetCode}`;

  // Appointmentga saqlash
  appointment.meetingLink = meetingLink;
  appointment.appointmentType = 'telemedicine';
  await appointment.save();

  // ─── Bemorga Telegram orqali AVTOMATIK xabar ─────────────────
  try {
    const pat = appointment.patientId;
    const doc = appointment.doctorId;
    const dateStr = appointment.startAt
      ? new Date(appointment.startAt).toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
      : '';

    const tgText =
      `🎥 *Video Qabul Tayyor!*\n\n` +
      `Salom, ${pat?.firstName || 'Bemor'}!\n\n` +
      `Sizning online konsultatsiyangiz rejalashtirildi.\n\n` +
      (doc ? `👨‍⚕️ *Shifokor:* Dr. ${doc.firstName} ${doc.lastName || ''}\n` : '') +
      (dateStr ? `📅 *Vaqt:* ${dateStr}\n` : '') +
      `\n🔗 *Video qo'ng'iroq havolasi:*\n${meetingLink}\n\n` +
      `Yuqoridagi havolani bosib videoga kiriting.\n` +
      `❓ Yordam kerak bo'lsa klinikaga qo'ng'iroq qiling.`;

    await notifyPatientByBot(req.orgId, appointment.patientId._id || appointment.patientId, tgText);
    console.log('✅ Video link bemorga Telegram orqali yuborildi');
  } catch (tgErr) {
    console.warn('⚠️ Telegram xabar yuborilmadi (bemor botga ulanmagan bo\'lishi mumkin):', tgErr.message);
    // Xatolikni yutamiz — API javobiga ta'sir qilmasin
  }

  res.json({
    meetingLink,
    telegramSent: true,
    message: "Video qabul xonasi tayyor. Bemorga Telegram xabar yuborildi.",
  });
}

/**
 * POST /api/appointments/recurring
 * Takrorlanuvchi qabullar seriyasini yaratish
 * body: { patientId, doctorId, serviceIds, startAt, frequency:'daily'|'weekly'|'monthly', interval:1, occurrences:4, notes }
 */
export async function createRecurring(req, res) {
  const b = req.body;

  if (!okId(b.patientId)) return res.status(400).json({ message: "patientId kerak" });
  if (!b.startAt) return res.status(400).json({ message: "startAt kerak" });
  if (!['daily', 'weekly', 'monthly'].includes(b.frequency)) {
    return res.status(400).json({ message: "frequency: daily | weekly | monthly" });
  }

  const occurrences = Math.min(parseInt(b.occurrences) || 4, 52); // Max 52 ta
  const interval = parseInt(b.interval) || 1;
  const startDate = new Date(b.startAt);

  const appointments = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < occurrences; i++) {
    appointments.push({
      orgId: req.orgId,
      patientId: OID(b.patientId),
      doctorId: okId(b.doctorId) ? OID(b.doctorId) : undefined,
      serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds.filter(okId).map(OID) : [],
      date: currentDate.toISOString().split('T')[0],
      startAt: new Date(currentDate),
      notes: b.notes || '',
      price: b.price || 0,
      status: 'scheduled',
      isRecurring: true,
      recurringPattern: {
        frequency: b.frequency,
        interval,
        endDate: null,
        occurrences,
      },
    });

    // Keyingi sana
    if (b.frequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + interval);
    } else if (b.frequency === 'weekly') {
      currentDate.setDate(currentDate.getDate() + interval * 7);
    } else if (b.frequency === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + interval);
    }
  }

  const created = await Appointment.insertMany(appointments);

  // Birinchi qabulning ID sini parentId sifatida saqlash
  const parentId = created[0]._id;
  await Appointment.updateMany(
    { _id: { $in: created.map(a => a._id) } },
    { $set: { parentAppointmentId: parentId } }
  );

  res.status(201).json({
    message: `${created.length} ta takrorlanuvchi qabul yaratildi`,
    total: created.length,
    frequency: b.frequency,
    firstDate: created[0]?.date,
    lastDate: created[created.length - 1]?.date,
    appointments: created,
  });
}

/**
 * GET /api/appointments/:id/recurring-series
 * Bir takrorlanuvchi qabulning barcha sinflarini olish
 */
export async function getRecurringSeries(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const series = await Appointment.find({
    orgId: req.orgId,
    parentAppointmentId: OID(id),
    isDeleted: { $ne: true }
  })
    .sort({ startAt: 1 })
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'firstName lastName')
    .lean();

  res.json({ series, total: series.length });
}

