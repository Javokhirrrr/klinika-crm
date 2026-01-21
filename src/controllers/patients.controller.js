// src/controllers/patients.controller.js
import Joi from "joi";
import mongoose from "mongoose";
import { Patient } from "../models/Patient.js";

/* ------------------------ helpers ------------------------ */
function normalizeGender(v, helpers) {
  if (v == null || v === "") return undefined; // optional
  const m = String(v).trim().toLowerCase();
  const map = {
    m: "male", male: "male", erkak: "male",
    f: "female", female: "female", ayol: "female",
    other: "other",
  };
  const out = map[m];
  if (!out) return helpers.error("any.invalid");
  return out;
}
const genderJoi = Joi.string()
  .custom(normalizeGender, "normalize gender")
  .messages({ "any.invalid": "gender must be male/female/other" });

const toBool = (v) => {
  if (v === true || v === false) return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["1", "true", "yes", "ha"].includes(s);
};

// yosh diapazonini DOB diapazoniga o‘girish
function dobRangeFromAges({ ageMin, ageMax }) {
  const out = {};
  const now = new Date();
  if (ageMax) {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - Number(ageMax) - 1);
    d.setMonth(11); d.setDate(31); d.setHours(23,59,59,999);
    out.$lte = d;
  }
  if (ageMin) {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - Number(ageMin));
    d.setMonth(0); d.setDate(1); d.setHours(0,0,0,0);
    out.$gte = d;
  }
  return Object.keys(out).length ? out : undefined;
}

const trimStr = (s) => (typeof s === "string" ? s.trim() : s);

/* ------------------------ schemas ------------------------ */
const baseFields = {
  firstName: Joi.string().min(1),
  lastName:  Joi.string().allow("", null),
  phone:     Joi.string().allow("", null),
  email:     Joi.string().email().allow("", null),
  dob:       Joi.date().allow(null),
  gender:    genderJoi.allow("", null),
  notes:     Joi.string().allow("", null),

  // yangi
  complaint: Joi.string().allow("", null),
  cardNo:    Joi.string().max(64).allow("", null),
  // ixtiyoriy qo‘llab: fullName -> split first/last
  fullName:  Joi.string().allow("", null),
};

const createSchema = Joi.object({
  ...baseFields,
  firstName: baseFields.firstName.required(),
});

const updateSchema = Joi.object(baseFields).min(1);

/* ======================== CONTROLLERS ======================== */
export async function listPatients(req, res) {
  try {
    const orgId = req.orgId;
    // bir xil nomlar: q yoki search
    const {
      q,
      search,
      page = 1,
      limit = 20,
      gender,
      ageMin,
      ageMax,
      createdFrom,
      createdTo,
      cardNo,
      hasPhone,
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { orgId, isDeleted: { $ne: true } };

    // umumiy qidiruv
    const queryText = trimStr(q) || trimStr(search);
    if (queryText) {
      const safe = queryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [
        { firstName: rx },
        { lastName:  rx },
        { phone:     rx },
        { email:     rx },
        { cardNo:    rx },
      ];
    }

    // gender normalizatsiya
    if (gender) {
      const { value, error } = genderJoi.validate(gender);
      if (error) return res.status(400).json({ message: error.message });
      if (value) filter.gender = value;
    }

    // age -> dob diapazon
    const dobRange = dobRangeFromAges({ ageMin, ageMax });
    if (dobRange) filter.dob = dobRange;

    // yaratilgan sana bo‘yicha
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
      if (createdTo) {
        const dt = new Date(createdTo);
        dt.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = dt;
      }
    }

    // cardNo aniq filtri
    if (cardNo) {
      const safe = String(cardNo).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.cardNo = new RegExp(safe, "i");
    }

    // telefon bor
    if (toBool(hasPhone)) {
      filter.phone = { $exists: true, $ne: "" };
    }

    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      Patient.countDocuments(filter),
    ]);

    return res.json({ items, total, page: p, limit: l });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
}

export async function createPatient(req, res) {
  try {
    const orgId = req.orgId;

    // fullName bo‘lsa split qilib qo‘yib yuboramiz
    let payload = { ...req.body };
    if (!payload.firstName && payload.fullName) {
      const parts = String(payload.fullName).trim().split(/\s+/);
      payload.firstName = parts.shift() || "";
      payload.lastName = parts.join(" ");
    }

    const { value, error } = createSchema.validate(payload, {
      stripUnknown: true,
      convert: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    // trim
    value.firstName = trimStr(value.firstName);
    if (value.lastName != null) value.lastName = trimStr(value.lastName);
    if (value.phone != null) value.phone = trimStr(value.phone);
    if (value.cardNo != null) value.cardNo = trimStr(value.cardNo);
    if (value.email != null) value.email = trimStr(value.email);

    const doc = await Patient.create({ ...value, orgId });
    return res.status(201).json({ patient: doc });
  } catch (e) {
    // unique conflicts: phone/cardNo
    if (e && e.code === 11000) {
      const key = Object.keys(e.keyPattern || {})[0] || "value";
      const msg =
        key === "phone"
          ? "Bu telefon raqam bu klinikada allaqachon mavjud"
          : key === "cardNo"
          ? "Bu karta raqami bu klinikada allaqachon mavjud"
          : "Unique cheklovi buzildi";
      return res.status(409).json({ message: msg });
    }
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
}

export async function getPatient(req, res) {
  try {
    const orgId = req.orgId;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Patient.findOne({
      _id: id,
      orgId,
      isDeleted: { $ne: true },
    }).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ patient: doc });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
}

export async function updatePatient(req, res) {
  try {
    const orgId = req.orgId;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    // fullName qo‘llab-quvvatlash
    let payload = { ...req.body };
    if (payload.fullName && (!payload.firstName || payload.firstName === "")) {
      const parts = String(payload.fullName).trim().split(/\s+/);
      payload.firstName = parts.shift() || payload.firstName;
      payload.lastName =
        (parts.join(" ") || payload.lastName || "").trim() || undefined;
    }

    const { value, error } = updateSchema.validate(payload, {
      stripUnknown: true,
      convert: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    // trim
    if (value.firstName != null) value.firstName = trimStr(value.firstName);
    if (value.lastName != null) value.lastName = trimStr(value.lastName);
    if (value.phone != null) value.phone = trimStr(value.phone);
    if (value.cardNo != null) value.cardNo = trimStr(value.cardNo);
    if (value.email != null) value.email = trimStr(value.email);

    const doc = await Patient.findOneAndUpdate(
      { _id: id, orgId, isDeleted: { $ne: true } },
      { $set: value },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ patient: doc });
  } catch (e) {
    if (e && e.code === 11000) {
      const key = Object.keys(e.keyPattern || {})[0] || "value";
      const msg =
        key === "phone"
          ? "Bu telefon raqam bu klinikada allaqachon mavjud"
          : key === "cardNo"
          ? "Bu karta raqami bu klinikada allaqachon mavjud"
          : "Unique cheklovi buzildi";
      return res.status(409).json({ message: msg });
    }
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
}

export async function deletePatient(req, res) {
  try {
    const orgId = req.orgId;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Patient.findOneAndUpdate(
      { _id: id, orgId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal error" });
  }
}
