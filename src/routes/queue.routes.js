import express from 'express';
import * as queueController from '../controllers/queue.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Staff routes
router.post('/join', authenticate, authorize(['owner', 'admin', 'reception']), queueController.joinQueue);
router.get('/current', authenticate, queueController.getCurrentQueue);
router.get('/stats', authenticate, queueController.getQueueStats);
router.get('/doctor/:doctorId/stats', authenticate, queueController.getDoctorStats);
router.put('/:id/call', authenticate, authorize(['owner', 'admin', 'reception', 'doctor']), queueController.callPatient);
router.put('/:id/start', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.startService);
router.put('/:id/complete', authenticate, authorize(['owner', 'admin', 'doctor']), queueController.completeService);
router.put('/:id/cancel', authenticate, authorize(['owner', 'admin', 'reception']), queueController.cancelQueue);
router.put('/:id/priority', authenticate, authorize(['owner', 'admin']), queueController.changePriority);

// Public route (for patients to check their position)
router.get('/my-position', queueController.getMyPosition);

// PUBLIC: Queue display for waiting room screens (no auth)
router.get('/public/display', queueController.getPublicDisplay);

// Admin routes
router.delete('/clear-old', authenticate, authorize(['owner', 'admin']), queueController.clearOldEntries);

export default router;
