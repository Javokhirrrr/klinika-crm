import { MedicalHistory } from '../models/MedicalHistory.js';
import { Patient } from '../models/Patient.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Create medical history entry
 */
export const createMedicalHistory = async (req, res) => {
    try {
        const {
            patientId,
            appointmentId,
            date,
            type,
            title,
            description,
            doctorId,
            medications,
            labResults,
            vitalSigns,
            icd10Code,
            attachments
        } = req.body;

        const medicalHistory = await MedicalHistory.create({
            orgId: req.user.orgId,
            patientId,
            appointmentId,
            date: date || new Date(),
            type,
            title,
            description,
            doctorId: doctorId || req.user._id,
            medications,
            labResults,
            vitalSigns,
            icd10Code,
            attachments
        });

        await medicalHistory.populate([
            { path: 'patientId', select: 'firstName lastName phone' },
            { path: 'doctorId', select: 'firstName lastName spec' }
        ]);

        res.status(StatusCodes.CREATED).json({
            message: 'Kasallik tarixi qo\'shildi',
            medicalHistory
        });
    } catch (error) {
        console.error('Create medical history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get medical history for a patient
 */
export const getPatientMedicalHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type, startDate, endDate, limit = 50 } = req.query;

        const query = {
            orgId: req.user.orgId,
            patientId
        };

        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const history = await MedicalHistory.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .populate([
                { path: 'patientId', select: 'firstName lastName phone dob gender' },
                { path: 'doctorId', select: 'firstName lastName spec' },
                { path: 'appointmentId', select: 'startAt endAt' }
            ]);

        res.json({
            count: history.length,
            items: history
        });
    } catch (error) {
        console.error('Get patient medical history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get single medical history entry
 */
export const getMedicalHistoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const medicalHistory = await MedicalHistory.findOne({
            _id: id,
            orgId: req.user.orgId
        }).populate([
            { path: 'patientId', select: 'firstName lastName phone dob gender bloodType allergies chronicDiseases' },
            { path: 'doctorId', select: 'firstName lastName spec' },
            { path: 'appointmentId', select: 'startAt endAt' }
        ]);

        if (!medicalHistory) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Kasallik tarixi topilmadi'
            });
        }

        res.json({ medicalHistory });
    } catch (error) {
        console.error('Get medical history by ID error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Update medical history entry
 */
export const updateMedicalHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const medicalHistory = await MedicalHistory.findOneAndUpdate(
            { _id: id, orgId: req.user.orgId },
            { $set: updates },
            { new: true, runValidators: true }
        ).populate([
            { path: 'patientId', select: 'firstName lastName phone' },
            { path: 'doctorId', select: 'firstName lastName spec' }
        ]);

        if (!medicalHistory) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Kasallik tarixi topilmadi'
            });
        }

        res.json({
            message: 'Kasallik tarixi yangilandi',
            medicalHistory
        });
    } catch (error) {
        console.error('Update medical history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Delete medical history entry
 */
export const deleteMedicalHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const medicalHistory = await MedicalHistory.findOneAndDelete({
            _id: id,
            orgId: req.user.orgId
        });

        if (!medicalHistory) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Kasallik tarixi topilmadi'
            });
        }

        res.json({
            message: 'Kasallik tarixi o\'chirildi'
        });
    } catch (error) {
        console.error('Delete medical history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my medical history (for patients via Telegram)
 */
export const getMyMedicalHistory = async (req, res) => {
    try {
        const patientId = req.user._id;
        const { limit = 20 } = req.query;

        const history = await MedicalHistory.find({
            orgId: req.user.orgId,
            patientId
        })
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .populate('doctorId', 'firstName lastName spec')
            .select('-orgId -__v');

        res.json({
            count: history.length,
            items: history
        });
    } catch (error) {
        console.error('Get my medical history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
