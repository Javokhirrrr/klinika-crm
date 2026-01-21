import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { invoicePdf } from '../controllers/invoices.controller.js';

const r = Router();
r.use(authenticate);
r.get('/:id/pdf', authorize(['admin', 'accountant', 'reception', 'doctor']), invoicePdf);
export default r;
