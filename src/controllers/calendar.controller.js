// src/controllers/calendar.controller.js
import { Appointment } from '../models/Appointment.js';
import { DoctorSchedule } from '../models/DoctorSchedule.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

/**
 * Get calendar events (appointments) for a date range
 */
export const getCalendarEvents = async (req, res) => {
    try {
        const { startDate, endDate, doctorId } = req.query;
        const orgId = req.user.orgId;

        const match = {
            orgId: new mongoose.Types.ObjectId(orgId),
            startAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`)
            }
        };

        if (doctorId) {
            match.doctorId = new mongoose.Types.ObjectId(doctorId);
        }

        const appointments = await Appointment.find(match)
            .populate('patientId', 'firstName lastName phone')
            .populate('doctorId', 'firstName lastName')
            .populate('serviceIds', 'name price')
            .sort({ startAt: 1 })
            .lean();

        // Format for calendar
        const events = appointments.map(apt => ({
            id: apt._id,
            title: `${apt.patientId?.firstName || ''} ${apt.patientId?.lastName || ''}`,
            start: apt.startAt,
            end: apt.endAt || apt.startAt,
            doctor: `${apt.doctorId?.firstName || ''} ${apt.doctorId?.lastName || ''}`,
            patient: apt.patientId,
            services: apt.serviceIds,
            status: apt.status,
            isPaid: apt.isPaid,
            notes: apt.notes || apt.note,
            resourceId: apt.doctorId?._id
        }));

        res.json({ events });
    } catch (error) {
        console.error('Calendar events error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get doctor schedule
 */
export const getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const orgId = req.user.orgId;

        const schedule = await DoctorSchedule.findOne({
            orgId,
            doctorId
        }).lean();

        if (!schedule) {
            // Return default empty schedule
            return res.json({
                schedule: {
                    mon: { start: '', end: '' },
                    tue: { start: '', end: '' },
                    wed: { start: '', end: '' },
                    thu: { start: '', end: '' },
                    fri: { start: '', end: '' },
                    sat: { start: '', end: '' },
                    sun: { start: '', end: '' }
                }
            });
        }

        res.json({ schedule: schedule.week });
    } catch (error) {
        console.error('Get doctor schedule error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Update doctor schedule
 */
export const updateDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { week } = req.body;
        const orgId = req.user.orgId;

        const schedule = await DoctorSchedule.findOneAndUpdate(
            { orgId, doctorId },
            { week },
            { new: true, upsert: true }
        );

        res.json({ schedule });
    } catch (error) {
        console.error('Update doctor schedule error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Check doctor availability for a specific date/time
 */
export const checkAvailability = async (req, res) => {
    try {
        const { doctorId, date, time } = req.query;
        const orgId = req.user.orgId;

        const appointmentDate = new Date(date);
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][appointmentDate.getDay()];

        // Get doctor schedule
        const schedule = await DoctorSchedule.findOne({ orgId, doctorId });

        if (!schedule || !schedule.week[dayOfWeek]?.start) {
            return res.json({ available: false, reason: 'Shifokor bu kunda ishlamaydi' });
        }

        const daySchedule = schedule.week[dayOfWeek];

        // Check if time is within working hours
        if (time < daySchedule.start || time > daySchedule.end) {
            return res.json({ available: false, reason: 'Ish vaqtidan tashqarida' });
        }

        // Check for existing appointments at this time
        const existingAppointment = await Appointment.findOne({
            orgId,
            doctorId,
            appointmentDate,
            appointmentTime: time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.json({ available: false, reason: 'Bu vaqt band' });
        }

        res.json({ available: true });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get available time slots for a doctor on a specific date
 */
export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        const orgId = req.user.orgId;

        const appointmentDate = new Date(date);
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][appointmentDate.getDay()];

        // Get doctor schedule
        const schedule = await DoctorSchedule.findOne({ orgId, doctorId });

        if (!schedule || !schedule.week[dayOfWeek]?.start) {
            return res.json({ slots: [] });
        }

        const daySchedule = schedule.week[dayOfWeek];

        // Get existing appointments
        const existingAppointments = await Appointment.find({
            orgId,
            doctorId,
            appointmentDate,
            status: { $ne: 'cancelled' }
        }).select('appointmentTime').lean();

        const bookedTimes = new Set(existingAppointments.map(apt => apt.appointmentTime));

        // Generate time slots (30 min intervals)
        const slots = [];
        const [startHour, startMin] = daySchedule.start.split(':').map(Number);
        const [endHour, endMin] = daySchedule.end.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

            slots.push({
                time: timeStr,
                available: !bookedTimes.has(timeStr)
            });

            currentMin += 30;
            if (currentMin >= 60) {
                currentMin = 0;
                currentHour++;
            }
        }

        res.json({ slots });
    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
