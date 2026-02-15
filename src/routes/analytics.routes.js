import express from 'express';
import {
    getDashboardStats,
    getFinancialReport,
    getPatientStats,
    getDoctorPerformance
} from '../controllers/analytics.controller.js';
import {
    getDoctorsAnalytics,
    getDoctorAnalytics
} from '../controllers/doctorAnalytics.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Analytics endpoints
router.get('/dashboard-stats', getDashboardStats);
router.get('/financial-report', getFinancialReport);
router.get('/patient-stats', getPatientStats);
router.get('/doctor-performance', getDoctorPerformance);

// Doctor analytics
router.get('/doctors', getDoctorsAnalytics);
router.get('/doctors/:id', getDoctorAnalytics);

export default router;
