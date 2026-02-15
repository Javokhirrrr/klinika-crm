// src/controllers/doctorRoom.controller.js
import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { Service } from "../models/Service.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/**
 * GET /api/doctor-room/today
 * Returns appointments for the logged-in doctor for today
 */
export async function getDoctorTodayQueue(req, res) {
    try {
        const orgId = req.orgId;
        const userId = req.user._id;

        // Find the Doctor profile linked to this User
        const doctorProfile = await Doctor.findOne({ orgId, userId, isDeleted: { $ne: true } }).lean();

        if (!doctorProfile) {
            return res.status(404).json({ message: "Shifokor profili topilmadi" });
        }

        const today = new Date().toISOString().split('T')[0];

        const appointments = await Appointment.find({
            orgId,
            doctorId: doctorProfile._id,
            date: today,
            status: { $in: ["waiting", "in_progress", "done"] }
        })
            .populate("patientId", "firstName lastName phone dob gender bloodType allergies chronicDiseases medicalHistory")
            .populate("serviceIds", "name price")
            .sort({ startAt: 1 })
            .lean();

        return res.json({
            doctor: doctorProfile,
            appointments: appointments.map(apt => ({
                ...apt,
                patient: apt.patientId // frontend expects .patient
            }))
        });
    } catch (error) {
        console.error("Board today queue error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * POST /api/doctor-room/complete
 * body: { appointmentId, diagnosis, prescription, services: [], notes }
 */
export async function completeVisit(req, res) {
    try {
        const orgId = req.orgId;
        const { appointmentId, diagnosis, prescription, services, notes } = req.body;

        if (!okId(appointmentId)) {
            return res.status(400).json({ message: "Invalid appointmentId" });
        }

        const appointment = await Appointment.findOne({ _id: OID(appointmentId), orgId });
        if (!appointment) {
            return res.status(404).json({ message: "Qabul topilmadi" });
        }

        // 1. Update Appointment
        appointment.status = "done";
        appointment.completedAt = new Date();
        if (notes) appointment.notes = notes;
        if (Array.isArray(services) && services.length > 0) {
            appointment.serviceIds = services.map(id => OID(id));

            // Recalculate total price if needed
            const serviceDocs = await Service.find({ _id: { $in: appointment.serviceIds } });
            appointment.price = serviceDocs.reduce((sum, s) => sum + (s.price || 0), 0);
        }
        await appointment.save();

        // 2. Add to Patient Medical History
        const medicalRecord = {
            date: new Date(),
            doctorId: appointment.doctorId,
            appointmentId: appointment._id,
            diagnosis: diagnosis || "",
            prescription: prescription || "",
            notes: notes || "",
            status: "resolved"
        };

        await Patient.updateOne(
            { _id: appointment.patientId },
            {
                $push: { medicalHistory: medicalRecord },
                $set: { lastVisit: new Date() },
                $inc: { totalVisits: 1 }
            }
        );

        return res.json({ message: "Qabul muvaffaqiyatli yakunlandi", appointment });
    } catch (error) {
        console.error("Complete visit error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
