// src/routes/appointments.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  setAppointmentStatus,
  markAppointmentPaid,
} from "../controllers/appointments.controller.js";

const r = Router();

/**
 * Har bir endpoint:
 *  - authJwt: tokenni tekshiradi
 *  - requireOrg: token/header/cookiedan orgId olib req.orgId ga qo‘yadi
 */
r.use(authJwt, requireOrg);

// GET /api/appointments?status=&doctorId=&patientId=&from=&to=&page=1&limit=20&sort=startsAt:desc
r.get("/", listAppointments);

// POST /api/appointments
r.post("/", createAppointment);

// GET /api/appointments/:id
r.get("/:id", getAppointment);

// PUT /api/appointments/:id
r.put("/:id", updateAppointment);

// DELETE /api/appointments/:id   (soft-delete)
r.delete("/:id", deleteAppointment);

// PATCH /api/appointments/:id/status   body: { status: "waiting"|"in_progress"|"done" }
r.patch("/:id/status", setAppointmentStatus);

// POST /api/appointments/:id/mark-paid   (resepshen tugmasi uchun)
r.post("/:id/mark-paid", markAppointmentPaid);

export default r;
