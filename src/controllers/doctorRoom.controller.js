// src/controllers/doctorRoom.controller.js
import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { Service } from "../models/Service.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/**
 * GET /api/doctor-room/today?doctorId=xxx
 * Returns today's appointments for a doctor.
 * - doctor roli: o'z profilidagi appointmentlar
 * - admin/owner/director: ?doctorId=xxx query parametr orqali
 */
export async function getDoctorTodayQueue(req, res) {
    try {
        const orgId = req.orgId;
        const userId = req.user.id || req.user._id;
        const role = (req.user?.role || "").toLowerCase();
        const isDoctor = role === "doctor";

        let doctorProfileId = null;

        if (isDoctor) {
            // Shifokor o'z profilini topadi
            const doctorProfile = await Doctor.findOne({ orgId, userId, isDeleted: { $ne: true } }).lean();
            if (!doctorProfile) {
                return res.status(404).json({ message: "Shifokor profili topilmadi" });
            }
            doctorProfileId = doctorProfile._id;
        } else {
            // Admin/owner: query'dan doctorId parametrini oladi
            const { doctorId } = req.query;
            if (!doctorId || !okId(doctorId)) {
                return res.status(400).json({ message: "doctorId parametri talab qilinadi" });
            }
            doctorProfileId = OID(doctorId);
        }

        const today = new Date().toISOString().split('T')[0];

        const appointments = await Appointment.find({
            orgId,
            doctorId: doctorProfileId,
            date: today,
            status: { $in: ["scheduled", "waiting", "in_progress", "done"] }
        })
            .populate("patientId", "firstName lastName phone dob gender bloodType allergies chronicDiseases medicalHistory")
            .populate("serviceIds", "name price")
            .sort({ startsAt: 1 })
            .lean();

        return res.json({
            appointments: appointments.map(apt => ({
                ...apt,
                patient: apt.patientId // frontend expects .patient
            }))
        });
    } catch (error) {
        console.error("Doctor today queue error:", error);
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
