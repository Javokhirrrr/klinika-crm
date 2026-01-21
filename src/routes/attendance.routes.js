import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Employee routes
router.post('/clock-in', authenticate, attendanceController.clockIn);
router.post('/clock-out', authenticate, attendanceController.clockOut);
router.get('/my-today', authenticate, attendanceController.getMyToday);
router.get('/my-history', authenticate, attendanceController.getMyHistory);

// Admin routes
router.get('/', authenticate, authorize(['owner', 'admin']), attendanceController.getAllAttendance);
router.get('/report', authenticate, authorize(['owner', 'admin', 'accountant']), attendanceController.getAttendanceReport);
router.put('/:id', authenticate, authorize(['owner', 'admin']), attendanceController.updateAttendance);
router.delete('/:id', authenticate, authorize(['owner', 'admin']), attendanceController.deleteAttendance);

export default router;
