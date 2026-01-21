// src/models/TelegramLink.js
import mongoose from "mongoose";

const TelegramLinkSchema = new mongoose.Schema({
  orgId:  { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
  botId:  { type: mongoose.Schema.Types.ObjectId, ref: "TelegramBot", index: true, required: true },

  chatId: { type: String, required: true, index: true }, // Telegram chat.id
  phone:  { type: String, default: "", index: true },    // E.164
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },

  isAdmin: { type: Boolean, default: false, index: true },
}, { timestamps: true });

TelegramLinkSchema.index({ orgId:1, botId:1, phone:1 }, { unique: false });

export const TelegramLink = mongoose.model("TelegramLink", TelegramLinkSchema);
