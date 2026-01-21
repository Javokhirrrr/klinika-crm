// src/routes/system.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";

const r = Router();

// To'g'ri tartib: avval auth, keyin org
r.use(authJwt, requireOrg); // yoki requireOrg()

r.get("/ping", (_req, res) => res.json({ ok: true }));

export default r;
