// src/routes/twa.routes.js (faqat /auth qismi yangilandi)
import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyInitData, parseInitData } from "../utils/twa.js";
import { env } from "../config/env.js";
import { authJwt } from "../middlewares/authJwt.js";
import { Patient } from "../models/Patient.js";
import { Appointment } from "../models/Appointment.js";
import { Payment } from "../models/Payment.js";
import { Doctor } from "../models/Doctor.js";
import { Service } from "../models/Service.js";
import { OrgBot } from "../models/OrgBot.js";

const r = Router();

/** POST /api/twa/auth { initData } -> { accessToken } */
r.post("/auth", async (req, res) => {
  const raw = req.body?.initData || req.body;
  const { params } = parseInitData(raw);
  const tgUser = params?.user;
  if (!tgUser?.id) return res.status(400).json({ message: "Bad initData" });

  // 1) Telegram user orqali bemorni topamiz (shu bilan orgId ham keladi)
  const patient = await Patient.findOne({ telegramId: String(tgUser.id) }).lean();
  if (!patient) return res.status(404).json({ message: "Patient not linked" });

  // 2) Shu org bot tokenini olamiz va initData’ni SHU token bilan tekshiramiz
  const bot = await OrgBot.findOne({ orgId: patient.orgId }).lean();
  const botToken = bot?.botToken || process.env.TG_BOT_TOKEN || "";
  if (!botToken) return res.status(400).json({ message: "Bot token not set" });

  const ok = verifyInitData(raw, botToken);
  if (!ok) return res.status(401).json({ message: "Bad initData" });

  // 3) JWT
  const token = jwt.sign(
    { uid: String(patient._id), role: "patient", orgId: String(patient.orgId) },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
  res.json({ accessToken: token });
});

// ... qolgan /me, /appointments, /payments, /doctors, /services, /book o’zgarmaydi

export default r;
