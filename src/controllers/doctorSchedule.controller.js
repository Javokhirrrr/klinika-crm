// src/controllers/doctorSchedule.controller.js
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { DoctorSchedule } from "../models/DoctorSchedule.js";

const okId = (v) => mongoose.isValidObjectId(v);

const emptyWeek = () => ({
  mon:{start:"",end:""}, tue:{start:"",end:""}, wed:{start:"",end:""},
  thu:{start:"",end:""}, fri:{start:"",end:""}, sat:{start:"",end:""}, sun:{start:"",end:""},
});

const isTime = (s) => !s ? true : /^\d{2}:\d{2}$/.test(String(s));

function sanitizeWeek(w = {}) {
  const week = emptyWeek();
  for (const k of Object.keys(week)) {
    const src = w[k] || {};
    week[k] = {
      start: isTime(src.start) ? (src.start || "") : "",
      end:   isTime(src.end)   ? (src.end   || "") : "",
    };
  }
  return week;
}

export async function getDoctorSchedule(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });
  const doc = await DoctorSchedule.findOne({ orgId: req.orgId, doctorId: id }).lean();
  if (!doc) return res.json({ week: emptyWeek() });
  res.json({ week: sanitizeWeek(doc.week) });
}

export async function putDoctorSchedule(req, res) {
  const { id } = req.params;
  if (!okId(id)) return res.status(400).json({ message: "Invalid id" });
  const doctor = await Doctor.findOne({ _id: id, orgId: req.orgId, isDeleted: { $ne: true } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const week = sanitizeWeek(req.body?.week || {});

  const updated = await DoctorSchedule.findOneAndUpdate(
    { orgId: req.orgId, doctorId: id },
    { $set: { week } },
    { new: true, upsert: true, lean: true }
  );
  res.json({ week: updated.week });
}
