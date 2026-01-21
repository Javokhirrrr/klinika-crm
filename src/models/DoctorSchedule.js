// src/models/DoctorSchedule.js
import mongoose from "mongoose";

const DaySchema = new mongoose.Schema(
  { start: { type: String, default: "" }, end: { type: String, default: "" } },
  { _id: false }
);

const DoctorScheduleSchema = new mongoose.Schema(
  {
    orgId:    { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", index: true, required: true },
    week: {
      mon: { type: DaySchema, default: () => ({}) },
      tue: { type: DaySchema, default: () => ({}) },
      wed: { type: DaySchema, default: () => ({}) },
      thu: { type: DaySchema, default: () => ({}) },
      fri: { type: DaySchema, default: () => ({}) },
      sat: { type: DaySchema, default: () => ({}) },
      sun: { type: DaySchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

DoctorScheduleSchema.index({ orgId: 1, doctorId: 1 }, { unique: true });

export const DoctorSchedule = mongoose.model("DoctorSchedule", DoctorScheduleSchema);
