import express from 'express';
import {
    createMedicalHistory,
    getPatientMedicalHistory,
    getMedicalHistoryById,
    updateMedicalHistory,
    deleteMedicalHistory,
    getMyMedicalHistory
} from '../controllers/medicalHistory.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', createMedicalHistory);
router.get('/patient/:patientId', getPatientMedicalHistory);
router.get('/my-history', getMyMedicalHistory); // For patients
router.get('/:id', getMedicalHistoryById);
router.put('/:id', updateMedicalHistory);
router.delete('/:id', deleteMedicalHistory);

export default router;
