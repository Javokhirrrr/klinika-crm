// src/routes/doctorRoom.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import { requireRoles } from "../middlewares/roles.js";
import {
    getDoctorTodayQueue,
    completeVisit
} from "../controllers/doctorRoom.controller.js";

const r = Router();

r.use(authJwt, requireOrg);

// Only doctors can access their room
r.get("/today", requireRoles("doctor"), getDoctorTodayQueue);
r.post("/complete", requireRoles("doctor"), completeVisit);

export default r;
