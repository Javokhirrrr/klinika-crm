import express from 'express';
import { authenticateWebApp, getMyQueue, getMyPayments, getMyHistory } from '../controllers/telegram.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Web App authentication (no auth required)
router.post('/webapp/auth', authenticateWebApp);

// Web App endpoints (auth required)
router.get('/my-queue', authenticate, getMyQueue);
router.get('/my-payments', authenticate, getMyPayments);
router.get('/my-history', authenticate, getMyHistory);

export default router;
