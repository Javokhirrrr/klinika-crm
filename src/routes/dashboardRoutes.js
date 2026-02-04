import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', dashboardController.getMetrics);

// GET /api/dashboard/revenue - Get revenue data
router.get('/revenue', dashboardController.getRevenue);

export default router;
