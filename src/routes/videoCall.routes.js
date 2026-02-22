import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as appointmentController from '../controllers/appointments.controller.js';

const router = express.Router();

// Video call room yaratish / olish
router.post('/:id/meeting', authenticate, appointmentController.createMeetingRoom);

// Recurring appointment yaratish
router.post('/recurring', authenticate, appointmentController.createRecurring);

// Recurring seriyasini olish
router.get('/:id/recurring-series', authenticate, appointmentController.getRecurringSeries);

export default router;
