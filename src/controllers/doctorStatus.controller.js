// src/controllers/doctorStatus.controller.js
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** PATCH /api/doctors/:id/status - Update doctor's current status */
export async function updateDoctorStatus(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { status, patientId, appointmentId } = req.body;

    const validStatuses = ['available', 'busy', 'break', 'offline'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status. Must be one of: " + validStatuses.join(', ')
        });
    }

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Update status
    doctor.currentStatus = status;
    doctor.lastStatusUpdate = new Date();

    // Update current patient/appointment if provided
    if (status === 'busy') {
        if (patientId && okId(patientId)) {
            doctor.currentPatientId = OID(patientId);
        }
        if (appointmentId && okId(appointmentId)) {
            doctor.currentAppointmentId = OID(appointmentId);
        }
    } else {
        // Clear current patient/appointment when not busy
        doctor.currentPatientId = null;
        doctor.currentAppointmentId = null;
    }

    await doctor.save();

    res.json({
        _id: doctor._id,
        currentStatus: doctor.currentStatus,
        lastStatusUpdate: doctor.lastStatusUpdate,
        currentPatientId: doctor.currentPatientId,
        currentAppointmentId: doctor.currentAppointmentId
    });
}

/** GET /api/doctors/:id/status - Get doctor's current status */
export async function getDoctorStatus(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const doctor = await Doctor.findOne({
        _id: OID(id),
        orgId: req.orgId,
        isDeleted: { $ne: true }
    })
        .select('currentStatus lastStatusUpdate currentPatientId currentAppointmentId firstName lastName spec')
        .populate('currentPatientId', 'firstName lastName phone')
        .populate('currentAppointmentId', 'startAt endAt status')
        .lean();

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json(doctor);
}

/** GET /api/doctors/status/all - Get all doctors' statuses */
export async function getAllDoctorsStatus(req, res) {
    const { status, departmentId } = req.query;

    const filters = {
        orgId: req.orgId,
        isDeleted: { $ne: true },
        isActive: true
    };

    if (status && ['available', 'busy', 'break', 'offline'].includes(status)) {
        filters.currentStatus = status;
    }

    if (departmentId && okId(departmentId)) {
        filters.departmentId = OID(departmentId);
    }

    const doctors = await Doctor.find(filters)
        .select('firstName lastName spec currentStatus lastStatusUpdate currentPatientId currentAppointmentId departmentName room')
        .populate('currentPatientId', 'firstName lastName')
        .sort({ currentStatus: 1, lastName: 1 })
        .lean();

    // Group by status
    const grouped = {
        available: [],
        busy: [],
        break: [],
        offline: []
    };

    doctors.forEach(doc => {
        const status = doc.currentStatus || 'offline';
        if (grouped[status]) {
            grouped[status].push(doc);
        }
    });

    res.json({
        total: doctors.length,
        grouped,
        all: doctors
    });
}
