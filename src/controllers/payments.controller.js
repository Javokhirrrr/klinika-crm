// src/controllers/payments.controller.js
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import Joi from 'joi';
import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import PDFDocument from 'pdfkit';
import { qOrg, withOrgFields } from '../utils/org.js';
import { notifyPatientByBot } from "./bots.controller.js";
import { generateAndSendReceipt } from '../utils/receipt.js';

const createPaymentSchema = Joi.object({
  patientId: Joi.string().required(),
  appointmentId: Joi.string().allow(null, ''),
  doctorId: Joi.string().allow(null, ''), // NEW: for Doctor Room payments
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'card', 'transfer', 'online').required(),
  status: Joi.string().valid('completed', 'pending', 'failed', 'refunded'),
  note: Joi.string().allow('', null),
});

export async function listPayments(req, res) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.max(1, Number(req.query.limit ?? 50));
  const { patientId, method, status, from, to } = req.query;

  const q = qOrg(req, {});

  // Role-based filtering: If doctor, only show their own payments
  if (req.user.role === 'doctor') {
    const { Doctor } = await import('../models/Doctor.js');
    const doctor = await Doctor.findOne({
      orgId: req.user.orgId,
      userId: req.user._id,
      isDeleted: { $ne: true }
    }).lean();

    if (doctor) {
      // Find appointments for this doctor to filter payments
      const { Appointment } = await import('../models/Appointment.js');
      const doctorAppointments = await Appointment.find({ doctorId: doctor._id }).select('_id').lean();
      const appointmentIds = doctorAppointments.map(a => a._id);

      q.appointmentId = { $in: appointmentIds };
    } else {
      // If user is a doctor but no doctor profile found, return empty list for safety
      return res.json({ items: [], total: 0, page, limit });
    }
  }

  if (patientId) q.patientId = patientId;
  if (method) q.method = method;
  if (status) q.status = status;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      q.createdAt.$lte = d;
    }
  }

  // console.log("List Payments Query:", q);

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Payment.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('patientId', 'firstName lastName phone')
      .lean(),
    Payment.countDocuments(q),
  ]);

  res.json({ items, total, page, limit });
}

export async function createPayment(req, res) {
  const { value, error } = createPaymentSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const patient = await Patient.findOne(qOrg(req, { _id: value.patientId })).lean();
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  if (value.appointmentId) {
    const appt = await Appointment.findOne(qOrg(req, { _id: value.appointmentId })).lean();
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appt.patientId) !== String(value.patientId)) {
      return res.status(400).json({ message: 'Appointment does not belong to patient' });
    }
  }

  const created = await Payment.create(withOrgFields(req, {
    patientId: value.patientId,
    appointmentId: value.appointmentId || undefined,
    amount: value.amount,
    method: value.method,
    status: value.status || 'completed',
    note: value.note,
  }));

  // Update appointment payment status
  if (value.appointmentId) {
    await Appointment.updateOne(
      { _id: new mongoose.Types.ObjectId(value.appointmentId) },
      { $set: { isPaid: true, status: 'paid' } }
    );
  }

  // 💰 Auto-create commission if applicable
  try {
    let doctorId = null;

    // 1. Try to get doctor from appointment
    if (value.appointmentId) {
      const appt = await Appointment.findById(value.appointmentId).lean();
      if (appt && appt.doctorId) {
        doctorId = appt.doctorId;
      }
    }

    // 2. If no appointment, check if payment body has doctorId (from Doctor Room)
    if (!doctorId && value.doctorId) {
      doctorId = value.doctorId;
    }

    // 3. If we have a doctor, create commission
    if (doctorId) {
      const { Doctor } = await import('../models/Doctor.js');
      const doctor = await Doctor.findById(doctorId).lean();

      // Support both commissionRate and percent fields
      const commissionRate = doctor?.commissionRate || doctor?.percent || 0;
      const commissionEnabled = doctor?.commissionEnabled !== false; // Default to true if not set

      if (doctor && commissionEnabled && commissionRate > 0) {
        const { Commission } = await import('../models/Commission.js');
        const commissionAmount = (created.amount * commissionRate) / 100;

        await Commission.create({
          orgId: req.user.orgId,
          userId: doctor.userId || doctor._id,
          doctorId: doctor._id,
          paymentId: created._id,
          appointmentId: value.appointmentId || null,
          patientId: value.patientId,
          amount: commissionAmount,
          percentage: commissionRate,
          baseAmount: created.amount,
          status: 'pending'
        });

        console.log(`✅ Commission created for doctor ${doctor.firstName}: ${commissionAmount.toLocaleString()} so'm (${commissionRate}% of ${created.amount.toLocaleString()})`);
      } else {
        console.log(`⚠️ No commission - doctor: ${doctor?.firstName || 'N/A'}, rate: ${commissionRate}%, enabled: ${commissionEnabled}`);
      }
    } else {
      console.log(`ℹ️ No doctor found for payment - no commission created`);
    }
  } catch (err) {
    console.error('❌ Commission creation error:', err);
    // Don't fail payment if commission creation fails
  }

  // 🔔 Bot orqali bemorga xabar yuborish (muvaffaqiyatsiz bo‘lsa jim o'tadi)
  try {
    await notifyPatientByBot(
      req.orgId,
      created.patientId,
      `💳 To‘lov qabul qilindi: ${Number(created.amount || 0).toLocaleString()} so‘m. Rahmat!`
    );
  } catch { }

  // 📄 PDF chek yaratish va yuborish
  await generateAndSendReceipt(created, patient, req.user.orgId);

  // Avvalgi javob formatini buzmaslik uchun faqat id qaytaramiz
  res.status(201).json({ id: created.id, receiptNumber: created.receiptNumber });
}

export async function listPatientPayments(req, res) {
  const items = await Payment.find(qOrg(req, { patientId: req.params.id }))
    .sort({ createdAt: -1 }).lean();
  res.json({ items });
}

export async function invoicePdf(req, res) {
  const id = req.params.id;
  const appt = await Appointment.findOne(qOrg(req, { _id: id })).lean();
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  const patient = await Patient.findOne(qOrg(req, { _id: appt.patientId })).lean();
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const services = appt.serviceIds?.length
    ? await Service.find(qOrg(req, { _id: { $in: appt.serviceIds } })).lean()
    : [];

  const subtotal = services.reduce((sum, s) => sum + (s.price || 0), 0);

  const payments = await Payment.find(qOrg(req, { appointmentId: appt._id })).lean();
  const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = Math.max(0, subtotal - paid);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=invoice-${id}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text('Klinika CRM — Invoice');
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Invoice #: ${String(appt._id)}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  doc.fontSize(12).text('Patient:', { underline: true });
  doc.text(`${patient.firstName} ${patient.lastName}`);
  doc.text(`${patient.phone || ''} ${patient.email ? '• ' + patient.email : ''}`);
  doc.moveDown(1);

  doc.fontSize(12).text('Services:', { underline: true });
  if (!services.length) doc.text('No services');
  services.forEach((s) => doc.text(`${s.name} — ${s.price} UZS`));

  doc.moveDown(0.5);
  doc.text(`Subtotal: ${subtotal} UZS`);
  doc.text(`Paid: ${paid} UZS`);
  doc.text(`Balance: ${balance} UZS`);
  doc.end();
}

export async function patientBalance(req, res) {
  const patientId = req.params.id;

  const chargesAgg = await Appointment.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(req.user.orgId), patientId: new mongoose.Types.ObjectId(patientId), status: 'done' } },
    { $lookup: { from: 'services', localField: 'serviceIds', foreignField: '_id', as: 'srv' } },
    { $addFields: { calc: { $sum: '$srv.price' } } },
    { $group: { _id: '$patientId', charges: { $sum: '$calc' } } }
  ]);

  const paysAgg = await Payment.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(req.user.orgId), patientId: new mongoose.Types.ObjectId(patientId) } },
    { $group: { _id: '$patientId', paid: { $sum: '$amount' } } }
  ]);

  const charges = chargesAgg[0]?.charges || 0;
  const paid = paysAgg[0]?.paid || 0;
  const debt = Math.max(0, charges - paid);

  res.json({ charges, paid, debt });
}

export async function reportRevenue(req, res) {
  const { from, to, groupBy = 'day' } = req.query;

  const match = { orgId: new mongoose.Types.ObjectId(req.user.orgId) };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'appointments', localField: 'appointmentId', foreignField: '_id', as: 'appt' } },
    { $unwind: { path: '$appt', preserveNullAndEmptyArrays: true } },
  ];

  if (groupBy === 'doctor') {
    pipeline.push(
      { $group: { _id: '$appt.doctorId', total: { $sum: '$amount' } } },
      { $project: { _id: 0, doctorId: '$_id', total: 1 } }
    );
  } else {
    pipeline.push(
      { $addFields: { dt: '$createdAt' } },
      {
        $group: {
          _id: groupBy === 'month'
            ? { y: { $year: '$dt' }, m: { $month: '$dt' } }
            : { y: { $year: '$dt' }, m: { $month: '$dt' }, d: { $dayOfMonth: '$dt' } },
          total: { $sum: '$amount' },
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    );
  }

  const rows = await Payment.aggregate(pipeline);
  res.json({ rows });
}

export async function reportTopServices(req, res) {
  const { from, to, limit = 10 } = req.query;

  const match = { orgId: new mongoose.Types.ObjectId(req.user.orgId), status: 'done' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const rows = await Appointment.aggregate([
    { $match: match },
    { $unwind: '$serviceIds' },
    { $lookup: { from: 'services', localField: 'serviceIds', foreignField: '_id', as: 'srv' } },
    { $unwind: '$srv' },
    { $group: { _id: '$srv._id', name: { $first: '$srv.name' }, sold: { $sum: 1 }, revenue: { $sum: '$srv.price' } } },
    { $sort: { sold: -1, revenue: -1 } },
    { $limit: Number(limit) },
  ]);

  res.json({ rows });
}

export async function reportOutstandingDebts(req, res) {
  const rows = await Appointment.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(req.user.orgId), status: 'done' } },
    { $unwind: '$serviceIds' },
    { $lookup: { from: 'services', localField: 'serviceIds', foreignField: '_id', as: 'srv' } },
    { $unwind: '$srv' },
    { $group: { _id: '$patientId', charges: { $sum: '$srv.price' } } },
  ]);

  const pays = await Payment.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(req.user.orgId) } },
    { $group: { _id: '$patientId', paid: { $sum: '$amount' } } },
  ]);

  const paidMap = new Map(pays.map(p => [String(p._id), p.paid]));
  const out = [];
  for (const c of rows) {
    const pid = String(c._id);
    const paid = paidMap.get(pid) || 0;
    const debt = Math.max(0, (c.charges || 0) - paid);
    if (debt > 0) out.push({ patientId: pid, charges: c.charges, paid, debt });
  }

  res.json({ rows: out.sort((a, b) => b.debt - a.debt) });
}
