// src/controllers/doctors.controller.js
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** GET /api/doctors? q=&spec=&active=&from=&to=&page=1&limit=20&sort=createdAt:desc */
export async function listDoctors(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);
  const skip = (page - 1) * limit;

  const {
    q = "",             // ism/familiya/telefon izlash
    spec = "",             // aniq mutaxassislik
    active = "",            // "true" | "false"
    from = "",             // createdAt >=
    to = "",             // createdAt <=
    sort = "createdAt:desc",
  } = req.query;

  const filters = { orgId: req.orgId, isDeleted: { $ne: true } };

  if (q && q.trim()) {
    const s = q.trim();
    filters.$or = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }

  if (spec && spec.trim()) filters.spec = spec.trim();
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;

  if (from || to) {
    filters.createdAt = {};
    if (from) filters.createdAt.$gte = new Date(from);
    if (to) filters.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [sf, sd] = String(sort).split(":");
  const sortObj = sf ? { [sf]: sd === "asc" ? 1 : -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Doctor.find(filters).sort(sortObj).skip(skip).limit(limit).lean(),
    Doctor.countDocuments(filters),
  ]);

  res.json({ items, total, page, limit });
}

/** GET /api/doctors/specs — org bo‘yicha distinct mutaxassisliklar */
export async function listSpecs(req, res) {
  const specs = await Doctor.distinct("spec", { orgId: req.orgId, isDeleted: { $ne: true }, spec: { $ne: "" } });
  res.json({ items: specs.sort() });
}

/** POST /api/doctors */
export async function createDoctor(req, res) {
  const {
    firstName,
    lastName = "",
    phone = "",
    spec = "",
    room = "",
    percent = 0,
    note = "",
    // Login access fields
    createLoginAccess = false,
    loginEmail = "",
    loginPassword = ""
  } = req.body || {};

  if (!firstName || !firstName.trim()) return res.status(400).json({ message: "firstName is required" });

  // Create doctor
  const doc = await Doctor.create({
    orgId: req.orgId,
    firstName: firstName.trim(),
    lastName: (lastName || "").trim(),
    phone: (phone || "").trim(),
    spec: (spec || "").trim(),
    room: (room || "").trim(),
    percent: Number(percent || 0),
    note: (note || "").trim(),
  });

  // If createLoginAccess is true, create a User account
  let userId = null;
  if (createLoginAccess && loginEmail && loginPassword) {
    try {
      const { User } = await import('../models/User.js');
      const { hashPassword } = await import('../utils/passwords.js');
      const { ROLE_PERMISSIONS } = await import('../constants/permissions.js');

      const passwordHash = await hashPassword(loginPassword);

      const user = await User.create({
        orgId: req.orgId,
        name: `${firstName} ${lastName}`.trim(),
        email: loginEmail.toLowerCase().trim(),
        phone: (phone || "").trim(),
        role: 'doctor',
        passwordHash,
        isActive: true,
        // Auto-assign default doctor permissions
        permissions: ROLE_PERMISSIONS.doctor || [],
      });

      userId = user._id;

      // Link doctor to user
      doc.userId = userId;
      await doc.save();
    } catch (err) {
      // If user creation fails, still return doctor but with error message
      console.error('Failed to create user account for doctor:', err);
      return res.status(201).json({
        ...doc.toObject(),
        userCreationError: err.message || 'Failed to create login account'
      });
    }
  }

  res.status(201).json(doc);
}

/** GET /api/doctors/:id */
export async function getDoctor(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const d = await Doctor.findOne({ _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } }).lean();
  if (!d) return res.status(404).json({ message: "Not found" });
  res.json(d);
}

/** PUT /api/doctors/:id */
export async function updateDoctor(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const payload = {};
  const fields = ["firstName", "lastName", "phone", "spec", "room", "note"];
  fields.forEach(k => {
    if (typeof req.body?.[k] === "string") payload[k] = req.body[k].trim();
  });
  if (req.body?.percent !== undefined) payload.percent = Number(req.body.percent || 0);
  if (req.body?.isActive !== undefined) payload.isActive = !!req.body.isActive;

  const updated = await Doctor.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: payload },
    { new: true, lean: true }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
}

/** DELETE /api/doctors/:id (soft delete) */
export async function deleteDoctor(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const updated = await Doctor.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, isActive: false } },
    { new: true, lean: true }
  );
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
}

/** PATCH /api/doctors/:id/toggle-active */
export async function toggleActive(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const d = await Doctor.findOne({ _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } });
  if (!d) return res.status(404).json({ message: "Not found" });

  d.isActive = !d.isActive;
  await d.save();

  res.json({ _id: d._id, isActive: d.isActive });
}

/** POST /api/doctors/:id/restore (restore soft-deleted doctor) */
export async function restoreDoctor(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });

  const restored = await Doctor.findOneAndUpdate(
    { _id: OID(id), orgId: req.orgId },
    { $set: { isDeleted: false, isActive: true } },
    { new: true, lean: true }
  );

  if (!restored) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
}

