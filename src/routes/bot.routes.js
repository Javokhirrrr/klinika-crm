import express from 'express';
import * as botController from '../controllers/bot.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Bot management routes (owner/admin only)
router.post('/', authenticate, authorize(['owner', 'admin']), botController.addBot);
router.get('/', authenticate, authorize(['owner', 'admin']), botController.getBots);
router.delete('/:id', authenticate, authorize(['owner', 'admin']), botController.deleteBot);

export default router;
