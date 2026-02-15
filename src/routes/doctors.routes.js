// src/routes/doctors.routes.js
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt.js";
import { requireOrg } from "../middlewares/tenant.js";
import {
  listDoctors, listSpecs,
  createDoctor, getDoctor, updateDoctor, deleteDoctor,
  toggleActive, restoreDoctor,
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

// Wallet controllers
import {
  getDoctorWallet,
  getWalletTransactions,
  processWithdrawal,
  addBonus,
  addPenalty,
  getWalletStats
} from "../controllers/doctorWallet.controller.js";

// Status controllers
import {
  updateDoctorStatus,
  getDoctorStatus,
  getAllDoctorsStatus
} from "../controllers/doctorStatus.controller.js";

// Services controllers
import {
  getDoctorServices,
  addServiceToDoctor,
  removeServiceFromDoctor,
  updateDoctorService
} from "../controllers/doctorServices.controller.js";

const r = Router();

// har doim: auth + org
r.use(authJwt, requireOrg);

// Filtrlangan ro'yxat
r.get("/", listDoctors);

// Distinct mutaxassisliklar
r.get("/specs/list", listSpecs);

// All doctors status
r.get("/status/all", getAllDoctorsStatus);

// CRUD
r.post("/", createDoctor);
r.get("/:id", getDoctor);
r.put("/:id", updateDoctor);
r.delete("/:id", deleteDoctor);

// Active/Inactive
r.patch("/:id/toggle-active", toggleActive);

// Restore deleted doctor
r.post("/:id/restore", restoreDoctor);

// ======== Doctor Status ========
r.get("/:id/status", getDoctorStatus);
r.patch("/:id/status", updateDoctorStatus);

// ======== Doctor Services ========
r.get("/:id/services", getDoctorServices);
r.post("/:id/services", addServiceToDoctor);
r.delete("/:id/services/:serviceId", removeServiceFromDoctor);
r.patch("/:id/services/:serviceId", updateDoctorService);

// ======== Doctor Wallet ========
r.get("/:id/wallet", getDoctorWallet);
r.get("/:id/wallet/transactions", getWalletTransactions);
r.get("/:id/wallet/stats", getWalletStats);
r.post("/:id/wallet/withdrawal", processWithdrawal);
r.post("/:id/wallet/bonus", addBonus);
r.post("/:id/wallet/penalty", addPenalty);

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
