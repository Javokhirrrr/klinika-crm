// src/controllers/doctorCertificates.controller.js
import fs from "fs";
import path from "path";
import multer from "multer";
import { Doctor } from "../models/Doctor.js";
import { DoctorCertificate } from "../models/DoctorCertificate.js";

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const toPublicPath = (p) => p.replace(/\\/g, "/"); // windows slashes fix

// Multer storage: uploads/doctors/:doctorId
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params;
    const base = path.join(process.cwd(), "uploads", "doctors", String(id));
    ensureDir(base);
    cb(null, base);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = (file.originalname || "file.pdf").replace(/[^a-zA-Z0-9_.-]+/g, "_");
    const name = `${ts}__${safe}`;
    cb(null, name);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname || "");
    cb(ok ? null : new Error("Only PDF is allowed"), ok);
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

export async function listDoctorCerts(req, res) {
  const { id } = req.params;
  await Doctor.exists({ _id: id, orgId: req.orgId, isDeleted: { $ne: true } }); // mavjudligini tekshirib qo'yamiz
  const items = await DoctorCertificate.find({ orgId: req.orgId, doctorId: id })
    .sort({ createdAt: -1 }).lean();
  res.json({
    items: items.map(c => ({
      _id: c._id,
      id: String(c._id),
      name: c.originalName || c.name,
      url: toPublicPath(c.url),
      uploadedAt: c.createdAt,
    }))
  });
}

export async function uploadDoctorCerts(req, res) {
  const { id } = req.params;
  const doctor = await Doctor.findOne({ _id: id, orgId: req.orgId, isDeleted: { $ne: true } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const files = (req.files || req.file ? ([]).concat(req.files || [], req.file || []) : [])
    .filter(Boolean);
  if (!files.length) return res.status(400).json({ message: "PDF fayl topilmadi" });

  const saved = await Promise.all(files.map(async (f) => {
    const rel = `/uploads/doctors/${id}/${f.filename}`; // public (nisbiy) URL
    const abs = path.join(process.cwd(), "uploads", "doctors", String(id), f.filename); // diskdagi to‘liq yo‘l
    const doc = await DoctorCertificate.create({
      orgId: req.orgId,
      doctorId: id,
      originalName: f.originalname,
      name: f.filename,
      mimetype: f.mimetype,
      size: f.size,
      url: rel,
      path: abs,
    });
    return doc;
  }));

  res.status(201).json({
    items: saved.map(c => ({
      _id: c._id,
      id: String(c._id),
      name: c.originalName || c.name,
      url: toPublicPath(c.url),
      uploadedAt: c.createdAt,
    }))
  });
}

export async function deleteDoctorCert(req, res) {
  const { id, certId } = req.params;
  const cert = await DoctorCertificate.findOne({ _id: certId, orgId: req.orgId, doctorId: id });
  if (!cert) return res.status(404).json({ message: "Not found" });
  try { if (fs.existsSync(cert.path)) fs.unlinkSync(cert.path); } catch {}
  await DoctorCertificate.deleteOne({ _id: certId });
  res.json({ ok: true });
}

export async function downloadDoctorCert(req, res) {
  const { id, certId } = req.params;
  const cert = await DoctorCertificate.findOne({ _id: certId, orgId: req.orgId, doctorId: id });
  if (!cert) return res.status(404).json({ message: "Not found" });
  if (!fs.existsSync(cert.path)) return res.status(404).json({ message: "File missing" });
  res.setHeader("Content-Type", cert.mimetype || "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${cert.originalName || cert.name}"`);
  return res.sendFile(cert.path);
}
