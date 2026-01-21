// src/models/TelegramBot.js
import mongoose from "mongoose";

const FlagsSchema = new mongoose.Schema({
  notifyAppointment: { type: Boolean, default: true },
  notifyPayment:     { type: Boolean, default: true },
  notifyExpense:     { type: Boolean, default: false },
  notifyDebtChange:  { type: Boolean, default: false },
}, { _id:false });

const TelegramBotSchema = new mongoose.Schema({
  orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
  name:    { type: String, default: "" },
  username:{ type: String, default: "" },
  token:   { type: String, required: true },     // bot token
  secret:  { type: String, required: true },     // webhook secret
  webhookUrl: { type: String, default: "" },

  // Administrator telefonlari (E.164) — mas: +998901112233
  adminsPhones: { type: [String], default: [], index: true },

  flags: { type: FlagsSchema, default: () => ({}) },

  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

TelegramBotSchema.index({ orgId:1, isActive:1 });

export const TelegramBot = mongoose.model("TelegramBot", TelegramBotSchema);
