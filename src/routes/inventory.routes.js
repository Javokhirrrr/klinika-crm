import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// O'qish (Hamma autentifikatsiyadan o'tgan foydalanuvchilar ko'rishi mumkin)
router.use(protect);
router.get('/items', inventoryController.getItems);
router.get('/items/:id', inventoryController.getItem);
router.get('/transactions', inventoryController.getTransactions);

// Yozish / Tahrirlash (Faqat admin va direktorlarga ruxsat berilishi mumkin, ehtiyojga qarab o'zgartirish)
router.use(restrictTo('admin', 'director'));
router.post('/items', inventoryController.createItem);
router.patch('/items/:id', inventoryController.updateItem);
router.delete('/items/:id', inventoryController.deleteItem);

// Kirim/Chiqim tranzaksiyasi
router.post('/transactions', inventoryController.addTransaction);

export default router;
