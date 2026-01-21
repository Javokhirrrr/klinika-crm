import express from 'express';
import * as commissionController from '../controllers/commission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.get('/my-earnings', authenticate, commissionController.getMyEarnings);
router.get('/my-history', authenticate, commissionController.getMyHistory);

// Admin routes
router.get('/', authenticate, authorize(['owner', 'admin', 'accountant']), commissionController.getAllCommissions);
router.get('/report', authenticate, authorize(['owner', 'admin', 'accountant']), commissionController.getCommissionReport);
router.put('/:id/approve', authenticate, authorize(['owner', 'admin']), commissionController.approveCommission);
router.put('/:id/pay', authenticate, authorize(['owner', 'admin', 'accountant']), commissionController.payCommission);
router.put('/:id/cancel', authenticate, authorize(['owner', 'admin']), commissionController.cancelCommission);

// User commission settings
router.put('/users/:id/settings', authenticate, authorize(['owner', 'admin']), commissionController.updateUserCommissionSettings);

export default router;
