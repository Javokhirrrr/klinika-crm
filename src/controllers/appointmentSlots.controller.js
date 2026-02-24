// src/controllers/appointmentSlots.controller.js
import { User } from "../models/User.js";
import { Appointment } from "../models/Appointment.js";
import mongoose from "mongoose";
import { getIO } from "../socket/index.js";

// Real-time appointment status emit helper
function emitAppointmentStatus(orgId, appointment) {
    try {
        const io = getIO();
        if (!io) return;
        io.to(`org:${orgId}`).emit('appointment:status-changed', {
            appointmentId: appointment._id,
            status: appointment.status,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('Socket emit error:', e.message);
    }
}

/**
 * Generate time slots between start and end time
 */
function generateTimeSlots(startStr, endStr, duration) {
    const slots = [];
    let current = new Date(`1970-01-01T${startStr}:00`);
    const end = new Date(`1970-01-01T${endStr}:00`);

    while (current < end) {
        const time = current.toTimeString().substring(0, 5);
        slots.push(time);
        current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
}

/**
 * GET /api/appointments/slots
 * Query params: doctorId, date (YYYY-MM-DD)
 */
export async function getAvailableSlots(req, res) {
    try {
        const { doctorId, date } = req.query;
        const orgId = req.orgId;

        if (!doctorId || !date) {
            return res.status(400).json({ message: "doctorId and date are required" });
        }

        const doctor = await User.findOne({ _id: doctorId, orgId, role: "doctor" });
        if (!doctor) {
            return res.status(404).json({ message: "Shifokor topilmadi" });
        }

        const shiftStart = doctor.shiftStart || "09:00";
        const shiftEnd = doctor.shiftEnd || "17:00";
        const duration = doctor.slotDuration || 20;

        // Generate all possible slots
        const allSlots = generateTimeSlots(shiftStart, shiftEnd, duration);

        // Get booked slots for this doctor on this date
        const bookedAppointments = await Appointment.find({
            orgId,
            doctorId,
            date,
            status: { $in: ["scheduled", "waiting", "in_progress", "done"] }
        }).select("startAt");

        const bookedTimes = bookedAppointments.map(app => {
            return new Date(app.startAt).toTimeString().substring(0, 5);
        });

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

        return res.json({
            doctorId,
            date,
            duration,
            slots: availableSlots
        });
    } catch (error) {
        console.error("Get slots error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * PATCH /api/appointments/:id/check-in
 * Patient arrived at the clinic
 */
export async function checkIn(req, res) {
    try {
        const { id } = req.params;
        const orgId = req.orgId;

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, orgId, status: "scheduled" },
            { $set: { status: "waiting", checkedInAt: new Date() } },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or already checked in" });
        }

        // 🔴 Real-time: barcha sahifalarga darhol xabar
        emitAppointmentStatus(orgId, appointment);

        return res.json({ message: "Check-in successful", appointment });
    } catch (error) {
        console.error("Check-in error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * PATCH /api/appointments/:id/update-status (alias) or /:id/status
 * Update appointment status — emits real-time socket event to ALL clients
 */
export async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const orgId = req.orgId;

        const allowedStatuses = ["scheduled", "waiting", "in_progress", "done", "cancelled", "no_show"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateData = { status };
        if (status === "in_progress") updateData.startedAt = new Date();
        if (status === "done") updateData.completedAt = new Date();

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, orgId },
            { $set: updateData },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // 🔴 Real-time: qabul va shifokor xonasi sahifalariga DARHOL xabar
        emitAppointmentStatus(orgId, appointment);

        return res.json({ message: `Status updated to ${status}`, appointment });
    } catch (error) {
        console.error("Update status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
