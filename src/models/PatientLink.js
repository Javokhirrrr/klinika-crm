// src/models/PatientLink.js
import mongoose from "mongoose";

const PatientLinkSchema = new mongoose.Schema({
  orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
  botId:     { type: mongoose.Schema.Types.ObjectId, ref: "OrgBot", index: true, required: true },

  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", index: true, required: true },

  tgUserId:  { type: String, index: true }, // from update.message.from.id
  chatId:    { type: String, index: true }, // update.message.chat.id

  isActive:  { type: Boolean, default: true, index: true },
}, { timestamps: true });

PatientLinkSchema.index({ orgId: 1, botId: 1, patientId: 1 }, { unique: true });

export const PatientLink = mongoose.model("PatientLink", PatientLinkSchema);
