// src/controllers/users.controller.js
import Joi from 'joi';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/passwords.js';
import { toE164 } from '../utils/phone.js';

// ---- Joi schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  role: Joi.string().valid('admin', 'reception', 'doctor', 'accountant').required(),
  password: Joi.string().min(6).required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  email: Joi.string().email(),
  phone: Joi.string().allow('', null),
  role: Joi.string().valid('admin', 'reception', 'doctor', 'accountant'),
  password: Joi.string().min(6),
  isActive: Joi.boolean(),
}).min(1);

// helper: super/platform admin?
const isSuperish = (req) =>
  String(req.auth?.globalRole || req.auth?.role || '').toLowerCase() === 'superadmin';

// ---- List (TENANT-SCOPED)
export async function listUsers(req, res) {
  const page  = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
  const role  = (req.query.role || '').trim();
  const search = (req.query.search || '').trim();
  const includeDeleted = String(req.query.includeDeleted || 'false') === 'true';

  const q = {};

  // 🔐 Muhimi: har doim org bo‘yicha cheklaymiz.
  // Faqat superadmin bo‘lsa va query.orgId berilsa, o‘sha orgni ko‘ra oladi.
  if (isSuperish(req) && req.query.orgId) {
    q.orgId = req.query.orgId;
  } else {
    q.orgId = req.orgId;
  }

  if (role) q.role = role;
  if (!includeDeleted) q.isDeleted = { $ne: true };
  if (search) {
    q.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(q),
  ]);

  res.json({ items, total, page, limit });
}

// ---- Get (TENANT-SCOPED)
export async function getUser(req, res) {
  const doc = await User.findOne({ _id: req.params.id, orgId: req.orgId }).lean();
  if (!doc) return res.status(404).json({ message: 'User not found' });
  res.json(doc);
}

// ---- Create (TENANT-SCOPED)
export async function createUser(req, res) {
  const { value, error } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  if (value.phone) value.phone = toE164(value.phone);
  const passwordHash = await hashPassword(value.password);

  const created = await User.create({
    orgId: req.orgId,                 // ⬅️ MUHIM: hozirgi tenantga biriktiramiz
    name: value.name,
    email: value.email,
    phone: value.phone || undefined,
    role: value.role,
    passwordHash,
    isActive: true,
  });

  res.status(201).json({ id: created.id });
}

// ---- Update (TENANT-SCOPED)
export async function updateUser(req, res) {
  const { value, error } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const updates = { ...value };
  if (updates.phone) updates.phone = toE164(updates.phone);
  if (updates.password) {
    updates.passwordHash = await hashPassword(updates.password);
    delete updates.password;
  }

  const updated = await User.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },   // ⬅️ tenant scope
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json(updated);
}

// ---- Soft delete (TENANT-SCOPED)
export async function deleteUser(req, res) {
  const updated = await User.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },   // ⬅️ tenant scope
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  ).lean();
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
}

// ---- Restore (TENANT-SCOPED)
export async function restoreUser(req, res) {
  const updated = await User.findOneAndUpdate(
    { _id: req.params.id, orgId: req.orgId },   // ⬅️ tenant scope
    { $set: { isDeleted: false, isActive: true } },
    { new: true }
  ).lean();
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
}
