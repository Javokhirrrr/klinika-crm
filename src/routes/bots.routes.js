// src/routes/bots.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import { requireRoles } from "../middlewares/roles.js";

import {
  listBots,
  createBot,
  updateBot,
  deleteBot,
  testBot,
  telegramWebhook, // webhook uchun import
} from "../controllers/bots.controller.js";

const r = Router();

// 🧩 1. Telegram webhook (unauthenticated, shuning uchun eng yuqorida!)
r.post("/webhook/:id/:secret", telegramWebhook);

// 🧩 2. Auth bo‘lgan marshrutlar uchun
r.use(authJwt, requireOrg);

// faqat admin yoki owner kirishi mumkin
const ALLOWED = requireRoles("admin", "owner");

// CRUD
r.get("/", ALLOWED, listBots);
r.post("/", ALLOWED, createBot);
r.put("/:id", ALLOWED, updateBot);
r.delete("/:id", ALLOWED, deleteBot);

// test (telefon raqami yoki chatId bilan test xabar yuborish)
r.post("/:id/test", ALLOWED, testBot);

export default r;
