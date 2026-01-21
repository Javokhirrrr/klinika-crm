import PDFDocument from 'pdfkit';
import { Appointment } from '../models/Appointment.js';
import { Patient } from '../models/Patient.js';
import { Service } from '../models/Service.js';
import { Payment } from '../models/Payment.js';

// GET /api/invoices/:id/pdf   (id = appointmentId)
export async function invoicePdf(req, res) {
  const id = req.params.id;

  const appt = await Appointment.findById(id).lean();
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  const patient = await Patient.findById(appt.patientId).lean();
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const services = appt.serviceIds?.length
    ? await Service.find({ _id: { $in: appt.serviceIds } }).lean()
    : [];

  const subtotal = services.reduce((sum, s) => sum + (s.price || 0), 0);

  // Paid amount for this appointment (optional)
  const payments = await Payment.find({ appointmentId: appt._id }).lean();
  const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = Math.max(0, subtotal - paid);

  // PDF response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=invoice-${id}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header
  doc.fontSize(18).text('Klinika CRM — Invoice', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Invoice #: ${String(appt._id)}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  // Patient info
  doc.fontSize(12).text('Patient:', { underline: true });
  doc.text(`${patient.firstName} ${patient.lastName}`);
  doc.text(`${patient.phone || ''} ${patient.email ? '• ' + patient.email : ''}`);
  doc.moveDown(1);

  // Services table
  doc.fontSize(12).text('Services:', { underline: true });
  doc.moveDown(0.25);

  if (services.length === 0) {
    doc.text('No services');
  } else {
    services.forEach((s) => {
      const line = `${s.name} — ${s.price?.toFixed?.(2) ?? s.price} UZS`;
      doc.text(line);
    });
  }

  doc.moveDown(0.5);
  doc.text(`Subtotal: ${subtotal.toFixed(2)} UZS`);
  doc.text(`Paid: ${paid.toFixed(2)} UZS`);
  doc.text(`Balance: ${balance.toFixed(2)} UZS`, { continued: false });

  doc.moveDown(1.5);
  doc.fontSize(10).text('Thank you!', { align: 'right' });

  doc.end();
}
