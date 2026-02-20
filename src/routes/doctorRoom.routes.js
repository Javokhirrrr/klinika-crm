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

// doctor, admin, owner, director — barchasi shifokor xonasiga kira oladi
// (requireRoles "owner" ni har doim o'tkazadi, shuning uchun extra qo'shish shart emas)
r.get("/today", requireRoles("doctor", "admin", "director"), getDoctorTodayQueue);
r.post("/complete", requireRoles("doctor", "admin", "director"), completeVisit);

export default r;
