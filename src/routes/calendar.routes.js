// src/routes/calendar.routes.js
import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
    getCalendarEvents,
    getDoctorSchedule,
    updateDoctorSchedule,
    checkAvailability,
    getAvailableSlots
} from '../controllers/calendar.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Calendar events
router.get('/events', getCalendarEvents);

// Doctor schedule
router.get('/schedule/:doctorId', getDoctorSchedule);
router.put('/schedule/:doctorId', updateDoctorSchedule);

// Availability
router.get('/availability', checkAvailability);
router.get('/slots', getAvailableSlots);

export default router;
