import { Router } from 'express';
import { get, update } from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Public or protected based on requirements. Usually settings are admin-only.
router.get('/:key', authenticate, get);
router.post('/:key', authenticate, update);

export default router;
