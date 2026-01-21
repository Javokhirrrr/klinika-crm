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

const r = Router();

/**
 * Har bir endpoint:
 *  - authJwt: Bearer JWT yoki cookie access_token ni tekshiradi
 *  - requireOrg: token ichidan orgId ni olib req.orgId ga qo‘yadi
 *  Shunda controller’lar ichida { orgId: req.orgId } bilan ishlaymiz
 */
r.use(authJwt, requireOrg);

// GET /api/patients?search=&page=&limit=
r.get('/', listPatients);

// POST /api/patients
r.post('/', createPatient);

// GET /api/patients/:id
r.get('/:id', getPatient);

// PUT /api/patients/:id
r.put('/:id', updatePatient);

// DELETE /api/patients/:id  (soft delete)
r.delete('/:id', deletePatient);

export default r; // MUHIM: default export
