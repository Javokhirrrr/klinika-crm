// src/controllers/patientMedical.controller.js
import mongoose from "mongoose";
import { Patient } from "../models/Patient.js";
import { Appointment } from "../models/Appointment.js";

/**
 * GET /api/patients/:id/history
 * Bemorning barcha kasallik tarixini olish
 */
export async function getPatientHistory(req, res) {
    try {
        const orgId = req.orgId;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const patient = await Patient.findOne({
            _id: id,
            orgId,
            isDeleted: { $ne: true }
        })
            .populate('medicalHistory.doctorId', 'firstName lastName spec')
            .populate('medicalHistory.appointmentId', 'date status')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Sort by date (newest first)
        const history = (patient.medicalHistory || []).sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        return res.json({
            patientId: patient._id,
            patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            totalRecords: history.length,
            history
        });
    } catch (error) {
        console.error('Get patient history error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * POST /api/patients/:id/medical-record
 * Yangi tashxis yoki tahlil natijasini qo'shish
 */
export async function addMedicalRecord(req, res) {
    try {
        const orgId = req.orgId;
        const { id } = req.params;
        const {
            doctorId,
            appointmentId,
            diagnosis,
            symptoms,
            prescription,
            labResults,
            notes,
            files,
            followUpDate,
            status = 'active'
        } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        if (!diagnosis && !symptoms && !prescription && !labResults) {
            return res.status(400).json({
                message: "At least one of diagnosis, symptoms, prescription, or labResults is required"
            });
        }

        const record = {
            date: new Date(),
            diagnosis,
            symptoms,
            prescription,
            labResults,
            notes,
            files: files || [],
            followUpDate: followUpDate ? new Date(followUpDate) : undefined,
            status
        };

        if (doctorId && mongoose.isValidObjectId(doctorId)) {
            record.doctorId = doctorId;
        }

        if (appointmentId && mongoose.isValidObjectId(appointmentId)) {
            record.appointmentId = appointmentId;
        }

        const patient = await Patient.findOneAndUpdate(
            { _id: id, orgId, isDeleted: { $ne: true } },
            {
                $push: { medicalHistory: record },
                $set: { lastVisit: new Date() },
                $inc: { totalVisits: 1 }
            },
            { new: true }
        )
            .populate('medicalHistory.doctorId', 'firstName lastName spec')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const addedRecord = patient.medicalHistory[patient.medicalHistory.length - 1];

        return res.status(201).json({
            message: "Medical record added successfully",
            record: addedRecord
        });
    } catch (error) {
        console.error('Add medical record error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * PUT /api/patients/:id/medical-record/:recordId
 * Mavjud medical recordni yangilash
 */
export async function updateMedicalRecord(req, res) {
    try {
        const orgId = req.orgId;
        const { id, recordId } = req.params;
        const updates = req.body;

        if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(recordId)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const updateFields = {};
        const allowedFields = ['diagnosis', 'symptoms', 'prescription', 'labResults', 'notes', 'followUpDate', 'status'];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                updateFields[`medicalHistory.$.${field}`] = updates[field];
            }
        });

        if (updates.files) {
            updateFields['medicalHistory.$.files'] = updates.files;
        }

        const patient = await Patient.findOneAndUpdate(
            {
                _id: id,
                orgId,
                isDeleted: { $ne: true },
                'medicalHistory._id': recordId
            },
            { $set: updateFields },
            { new: true }
        )
            .populate('medicalHistory.doctorId', 'firstName lastName spec')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient or record not found" });
        }

        const updatedRecord = patient.medicalHistory.find(r => r._id.toString() === recordId);

        return res.json({
            message: "Medical record updated successfully",
            record: updatedRecord
        });
    } catch (error) {
        console.error('Update medical record error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * DELETE /api/patients/:id/medical-record/:recordId
 * Medical recordni o'chirish
 */
export async function deleteMedicalRecord(req, res) {
    try {
        const orgId = req.orgId;
        const { id, recordId } = req.params;

        if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(recordId)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const patient = await Patient.findOneAndUpdate(
            { _id: id, orgId, isDeleted: { $ne: true } },
            { $pull: { medicalHistory: { _id: recordId } } },
            { new: true }
        ).lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        return res.json({
            message: "Medical record deleted successfully",
            ok: true
        });
    } catch (error) {
        console.error('Delete medical record error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * GET /api/patients/:id/payment-history
 * Bemorning to'lovlar tarixini olish
 */
export async function getPaymentHistory(req, res) {
    try {
        const orgId = req.orgId;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const patient = await Patient.findOne({
            _id: id,
            orgId,
            isDeleted: { $ne: true }
        })
            .select('paymentHistory balance loyaltyPoints discountPercent membershipLevel')
            .populate('paymentHistory.appointmentId', 'date')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const history = (patient.paymentHistory || []).sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        const totalPaid = history.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        return res.json({
            patientId: patient._id,
            balance: patient.balance || 0,
            loyaltyPoints: patient.loyaltyPoints || 0,
            discountPercent: patient.discountPercent || 0,
            membershipLevel: patient.membershipLevel || 'bronze',
            totalPaid,
            totalPayments: history.length,
            history
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * POST /api/patients/:id/payment
 * Yangi to'lov qo'shish
 */
export async function addPayment(req, res) {
    try {
        const orgId = req.orgId;
        const { id } = req.params;
        const {
            amount,
            paymentMethod,
            description,
            appointmentId,
            receiptNumber
        } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        if (!paymentMethod || !['cash', 'card', 'transfer', 'insurance'].includes(paymentMethod)) {
            return res.status(400).json({ message: "Valid payment method is required" });
        }

        const payment = {
            date: new Date(),
            amount: Number(amount),
            paymentMethod,
            description,
            receiptNumber
        };

        if (appointmentId && mongoose.isValidObjectId(appointmentId)) {
            payment.appointmentId = appointmentId;
        }

        // Calculate loyalty points (1 point per 10,000 sum)
        const pointsEarned = Math.floor(amount / 10000);

        const patient = await Patient.findOneAndUpdate(
            { _id: id, orgId, isDeleted: { $ne: true } },
            {
                $push: { paymentHistory: payment },
                $inc: {
                    totalSpent: amount,
                    loyaltyPoints: pointsEarned,
                    balance: -amount // Decrease debt
                }
            },
            { new: true }
        )
            .select('paymentHistory balance loyaltyPoints totalSpent')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const addedPayment = patient.paymentHistory[patient.paymentHistory.length - 1];

        return res.status(201).json({
            message: "Payment added successfully",
            payment: addedPayment,
            balance: patient.balance,
            loyaltyPoints: patient.loyaltyPoints,
            pointsEarned
        });
    } catch (error) {
        console.error('Add payment error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}

/**
 * GET /api/patients/:id/full-profile
 * Bemorning to'liq ma'lumotlari (360-degree view)
 */
export async function getFullProfile(req, res) {
    try {
        const orgId = req.orgId;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const patient = await Patient.findOne({
            _id: id,
            orgId,
            isDeleted: { $ne: true }
        })
            .populate('medicalHistory.doctorId', 'firstName lastName spec avatar')
            .populate('medicalHistory.appointmentId', 'date status')
            .lean();

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Get appointments
        const appointments = await Appointment.find({
            patientId: id,
            orgId
        })
            .populate('doctorId', 'firstName lastName spec')
            .sort({ date: -1 })
            .limit(20)
            .lean();

        // Calculate statistics
        const totalMedicalRecords = patient.medicalHistory?.length || 0;
        const totalPayments = patient.paymentHistory?.length || 0;
        const totalPaid = (patient.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        return res.json({
            patient,
            appointments: {
                total: appointments.length,
                items: appointments
            },
            statistics: {
                totalVisits: patient.totalVisits || 0,
                totalMedicalRecords,
                totalPayments,
                totalPaid,
                totalSpent: patient.totalSpent || 0,
                balance: patient.balance || 0,
                loyaltyPoints: patient.loyaltyPoints || 0,
                membershipLevel: patient.membershipLevel || 'bronze',
                lastVisit: patient.lastVisit
            }
        });
    } catch (error) {
        console.error('Get full profile error:', error);
        return res.status(500).json({ message: "Internal error" });
    }
}
