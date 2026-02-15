// src/routes/patients.routes.js
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';

import {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patients.controller.js';

import {
  getPatientHistory,
  addMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPaymentHistory,
  addPayment,
  getFullProfile
} from '../controllers/patientMedical.controller.js';

const r = Router();

/**
 * Har bir endpoint:
 *  - authJwt: Bearer JWT yoki cookie access_token ni tekshiradi
 *  - requireOrg: token ichidan orgId ni olib req.orgId ga qo'yadi
 *  Shunda controller'lar ichida { orgId: req.orgId } bilan ishlaymiz
 */
r.use(authJwt, requireOrg);

// ===== BASIC CRUD =====
// GET /api/patients?search=&page=&limit=
r.get('/', listPatients);

// POST /api/patients
r.post('/', createPatient);

// GET /api/patients/:id/full-profile - To'liq ma'lumot (360-degree view)
r.get('/:id/full-profile', getFullProfile);

// GET /api/patients/:id
r.get('/:id', getPatient);

// PUT /api/patients/:id
r.put('/:id', updatePatient);

// DELETE /api/patients/:id  (soft delete)
r.delete('/:id', deletePatient);

// ===== MEDICAL RECORDS =====
// GET /api/patients/:id/history - Kasallik tarixi
r.get('/:id/history', getPatientHistory);

// POST /api/patients/:id/medical-record - Yangi tashxis qo'shish
r.post('/:id/medical-record', addMedicalRecord);

// PUT /api/patients/:id/medical-record/:recordId - Tashxisni yangilash
r.put('/:id/medical-record/:recordId', updateMedicalRecord);

// DELETE /api/patients/:id/medical-record/:recordId - Tashxisni o'chirish
r.delete('/:id/medical-record/:recordId', deleteMedicalRecord);

// ===== PAYMENTS =====
// GET /api/patients/:id/payment-history - To'lovlar tarixi
r.get('/:id/payment-history', getPaymentHistory);

// POST /api/patients/:id/payment - Yangi to'lov qo'shish
r.post('/:id/payment', addPayment);

export default r; // MUHIM: default export
