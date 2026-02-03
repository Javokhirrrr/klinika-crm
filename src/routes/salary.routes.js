// src/routes/salary.routes.js
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';
import {
    calculateSalaries,
    updateUserSalary,
    getSalarySummary
} from '../controllers/salary.controller.js';

const r = Router();

// Auth + org required
r.use(authJwt, requireOrg);

// GET /api/salaries?month=2024-01&userId=xxx
r.get('/', calculateSalaries);

// GET /api/salaries/summary?month=2024-01
r.get('/summary', getSalarySummary);

// PUT /api/salaries/:userId (update salary settings)
r.put('/:userId', updateUserSalary);

export default r;
