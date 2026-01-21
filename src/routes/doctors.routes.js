// src/routes/doctors.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import {
  listDoctors, listSpecs,
  createDoctor, getDoctor, updateDoctor, deleteDoctor,
  toggleActive,
} from "../controllers/doctors.controller.js";

// NEW controllers (certificates + schedule)
import {
  listDoctorCerts,
  uploadDoctorCerts,
  deleteDoctorCert,
  downloadDoctorCert,
  upload,
} from "../controllers/doctorCertificates.controller.js";
import {
  getDoctorSchedule,
  putDoctorSchedule,
} from "../controllers/doctorSchedule.controller.js";

const r = Router();

// har doim: auth + org
r.use(authJwt, requireOrg);

// Filtrlangan ro‘yxat
r.get("/", listDoctors);

// Distinct mutaxassisliklar
r.get("/specs/list", listSpecs);

// CRUD
r.post("/", createDoctor);
r.get("/:id", getDoctor);
r.put("/:id", updateDoctor);
r.delete("/:id", deleteDoctor);

// Active/Inactive
r.patch("/:id/toggle-active", toggleActive);

// ======== Doctor Certificates (PDF only) ========
r.get("/:id/certificates", listDoctorCerts);
// accept both `files` and `file`
r.post("/:id/certificates", upload.any(), uploadDoctorCerts);
r.get("/:id/certificates/:certId", downloadDoctorCert);
r.delete("/:id/certificates/:certId", deleteDoctorCert);

// ======== Weekly Schedule ========
r.get("/:id/schedule", getDoctorSchedule);
r.put("/:id/schedule", putDoctorSchedule);

export default r;
