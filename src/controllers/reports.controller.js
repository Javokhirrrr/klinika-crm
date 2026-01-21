import Joi from 'joi';
import { Patient } from '../models/Patient.js';

// src/controllers/patients.controller.js

import { Patient } from '../models/Patient.js';

const createSchema = Joi.object({
  firstName: Joi.string().min(1).required(),
  lastName:  Joi.string().allow('', null),
  phone:     Joi.string().allow('', null),
  email:     Joi.string().email().allow('', null),
  dob:       Joi.date().allow(null),
  notes:     Joi.string().allow('', null),
});

export async function listPatients(req, res) {
  const orgId = req.orgId;
  const { search = '', page = 1, limit = 20 } = req.query;

  const q = { orgId, isDeleted: { $ne: true } };
  if (search) {
    const s = String(search).trim();
    q.$or = [
      { firstName: new RegExp(s, 'i') },
      { lastName:  new RegExp(s, 'i') },
      { phone:     new RegExp(s, 'i') },
      { email:     new RegExp(s, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Patient.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Patient.countDocuments(q),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
}

export async function createPatient(req, res) {
  const orgId = req.orgId;
  const { value, error } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const doc = await Patient.create({ ...value, orgId });
  res.status(201).json({ patient: doc });
}

export async function getPatient(req, res) {
  const orgId = req.orgId;
  const { id } = req.params;
  const doc = await Patient.findOne({ _id: id, orgId, isDeleted: { $ne: true } }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ patient: doc });
}

export async function updatePatient(req, res) {
  const orgId = req.orgId;
  const { id } = req.params;
  const { value, error } = createSchema.validate(req.body, { allowUnknown: true });
  if (error) return res.status(400).json({ message: error.message });

  const doc = await Patient.findOneAndUpdate(
    { _id: id, orgId, isDeleted: { $ne: true } },
    { $set: value },
    { new: true }
  ).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ patient: doc });
}

export async function deletePatient(req, res) {
  const orgId = req.orgId;
  const { id } = req.params;
  const doc = await Patient.findOneAndUpdate(
    { _id: id, orgId, isDeleted: { $ne: true } },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}
