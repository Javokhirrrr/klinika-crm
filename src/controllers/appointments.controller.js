// src/controllers/appointments.controller.js
import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { QueueEntry } from "../models/QueueEntry.js";
import { notifyPatientByBot } from "./bots.controller.js";
import { emitNewPatient } from "../socket/index.js";

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

  if (from || to) {
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

  // Transform to match frontend expectations
  const transformedItems = items.map(item => ({
    ...item,
    _id: item._id,
    patient: item.patientId,
    doctor: item.doctorId,
    service: Array.isArray(item.serviceIds) && item.serviceIds.length > 0 ? item.serviceIds[0] : null,
    scheduledAt: item.startAt,
    status: item.status === 'waiting' ? 'scheduled' :
      item.status === 'done' ? 'completed' :
        item.status,
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
  const scheduledAt = b.scheduledAt || b.startsAt;
  const serviceId = b.serviceId || (Array.isArray(b.serviceIds) && b.serviceIds[0]);

  const doc = await Appointment.create({
    orgId: req.orgId,
    patientId: OID(b.patientId),
    doctorId: okId(b.doctorId) ? OID(b.doctorId) : undefined,
    serviceIds: serviceId ? [OID(serviceId)] : [],
    startAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    note: typeof b.notes === "string" ? b.notes : (typeof b.note === "string" ? b.note : ""),
    status: "waiting",
    isPaid: false,
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
  if (scheduledAt) payload.startAt = new Date(scheduledAt);

  if (typeof b.notes === "string") payload.note = b.notes;
  if (typeof b.note === "string") payload.note = b.note;

  // Map frontend status to backend
  if (b.status) {
    const statusMap = {
      'scheduled': 'waiting',
      'in_progress': 'in_progress',
      'completed': 'done',
      'cancelled': 'cancelled',
    };
    const backendStatus = statusMap[b.status] || b.status;
    if (["waiting", "in_progress", "done", "cancelled"].includes(backendStatus)) {
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
    'scheduled': 'waiting',
    'in_progress': 'in_progress',
    'completed': 'done',
    'cancelled': 'cancelled',
  };

  const backendStatus = statusMap[status] || status;
  const allowed = ["waiting", "in_progress", "done", "cancelled"];

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
