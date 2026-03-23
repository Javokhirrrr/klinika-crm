import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';

const router = Router();
router.use(authJwt, requireOrg);

const allow = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(role)) return res.status(403).json({ message: 'Ruxsat etilmagan' });
  next();
};

const READ_ROLES = ['owner', 'admin', 'director', 'accountant', 'cashier', 'doctor', 'reception', 'receptionist'];
const WRITE_ROLES = ['owner', 'admin', 'director'];

// O'qish (Hamma autentifikatsiyadan o'tgan foydalanuvchilar ko'rishi mumkin)
router.get('/items', allow(READ_ROLES), inventoryController.getItems);
router.get('/items/:id', allow(READ_ROLES), inventoryController.getItem);
router.get('/transactions', allow(READ_ROLES), inventoryController.getTransactions);

// Yozish / Tahrirlash (Faqat admin va direktorlar)
router.post('/items', allow(WRITE_ROLES), inventoryController.createItem);
router.patch('/items/:id', allow(WRITE_ROLES), inventoryController.updateItem);
router.delete('/items/:id', allow(WRITE_ROLES), inventoryController.deleteItem);

// Kirim/Chiqim tranzaksiyasi
router.post('/transactions', allow(WRITE_ROLES), inventoryController.addTransaction);

export default router;
