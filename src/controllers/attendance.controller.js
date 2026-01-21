import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Clock in - Employee marks arrival
 */
export const clockIn = async (req, res) => {
    try {
        const userId = req.user._id;
        const { location } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existing = await Attendance.findOne({
            orgId: req.user.orgId,
            userId,
            date: today
        });

        if (existing) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Siz bugun allaqachon ishga kelgansiz'
            });
        }

        const clockInTime = new Date();

        // Determine if late (assuming work starts at 9:00 AM)
        const workStartHour = 9;
        const workStartTime = new Date(today);
        workStartTime.setHours(workStartHour, 0, 0, 0);

        const isLate = clockInTime > workStartTime;
        const lateMinutes = isLate ? Math.floor((clockInTime - workStartTime) / (1000 * 60)) : 0;

        const attendance = await Attendance.create({
            orgId: req.user.orgId,
            userId,
            date: today,
            clockIn: clockInTime,
            status: isLate ? 'late' : 'on_time',
            lateMinutes,
            clockInLocation: location
        });

        await attendance.populate('userId', 'name email');

        res.status(StatusCodes.CREATED).json({
            message: isLate ? `Kechikdingiz (${lateMinutes} daqiqa)` : 'Ishga muvaffaqiyatli keldingiz',
            attendance
        });
    } catch (error) {
        console.error('Clock in error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Clock out - Employee marks departure
 */
export const clockOut = async (req, res) => {
    try {
        const userId = req.user._id;
        const { location } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            orgId: req.user.orgId,
            userId,
            date: today
        });

        if (!attendance) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Avval ishga kelish kerak'
            });
        }

        if (attendance.clockOut) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Siz allaqachon ishdan ketgansiz'
            });
        }

        attendance.clockOut = new Date();
        attendance.clockOutLocation = location;
        attendance.status = attendance.status === 'late' ? 'late' : 'on_time';

        await attendance.save();  // workHours will be calculated by pre-save hook
        await attendance.populate('userId', 'name email');

        res.json({
            message: `Ishdan ketdingiz. Ish vaqti: ${attendance.workHours} soat`,
            attendance
        });
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get today's attendance for current user
 */
export const getMyToday = async (req, res) => {
    try {
        const userId = req.user._id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            orgId: req.user.orgId,
            userId,
            date: today
        }).populate('userId', 'name email');

        res.json({ attendance });
    } catch (error) {
        console.error('Get my today error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get attendance history for current user
 */
export const getMyHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, startDate, endDate } = req.query;

        const query = {
            orgId: req.user.orgId,
            userId
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [attendances, total] = await Promise.all([
            Attendance.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email'),
            Attendance.countDocuments(query)
        ]);

        res.json({
            attendances,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get my history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get all attendance records (Admin only)
 */
export const getAllAttendance = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, status, startDate, endDate } = req.query;

        const query = { orgId: req.user.orgId };

        if (userId) query.userId = userId;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [attendances, total] = await Promise.all([
            Attendance.find(query)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email role'),
            Attendance.countDocuments(query)
        ]);

        res.json({
            attendances,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get attendance report (Admin only)
 */
export const getAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;

        if (!startDate || !endDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Boshlanish va tugash sanalarini kiriting'
            });
        }

        const query = {
            orgId: req.user.orgId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (userId) query.userId = userId;

        const attendances = await Attendance.find(query)
            .populate('userId', 'name email role')
            .sort({ userId: 1, date: 1 });

        // Group by user
        const reportByUser = {};

        attendances.forEach(att => {
            const uid = att.userId._id.toString();
            if (!reportByUser[uid]) {
                reportByUser[uid] = {
                    user: att.userId,
                    totalDays: 0,
                    onTime: 0,
                    late: 0,
                    totalWorkHours: 0,
                    avgWorkHours: 0,
                    lateMinutes: 0
                };
            }

            reportByUser[uid].totalDays++;
            if (att.status === 'on_time') reportByUser[uid].onTime++;
            if (att.status === 'late') reportByUser[uid].late++;
            reportByUser[uid].totalWorkHours += att.workHours || 0;
            reportByUser[uid].lateMinutes += att.lateMinutes || 0;
        });

        // Calculate averages
        Object.values(reportByUser).forEach(report => {
            report.avgWorkHours = report.totalDays > 0
                ? Math.round((report.totalWorkHours / report.totalDays) * 100) / 100
                : 0;
        });

        res.json({
            report: Object.values(reportByUser),
            period: { startDate, endDate }
        });
    } catch (error) {
        console.error('Get attendance report error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Update attendance (Admin only)
 */
export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { clockIn, clockOut, status, notes, editReason } = req.body;

        const attendance = await Attendance.findOne({
            _id: id,
            orgId: req.user.orgId
        });

        if (!attendance) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Davomat topilmadi'
            });
        }

        if (clockIn) attendance.clockIn = new Date(clockIn);
        if (clockOut) attendance.clockOut = new Date(clockOut);
        if (status) attendance.status = status;
        if (notes) attendance.notes = notes;

        attendance.isManualEntry = true;
        attendance.editedBy = req.user._id;
        attendance.editReason = editReason || 'Admin tomonidan tahrirlandi';

        await attendance.save();
        await attendance.populate('userId', 'name email');

        res.json({
            message: 'Davomat yangilandi',
            attendance
        });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Delete attendance (Admin only)
 */
export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findOneAndDelete({
            _id: id,
            orgId: req.user.orgId
        });

        if (!attendance) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Davomat topilmadi'
            });
        }

        res.json({
            message: 'Davomat o\'chirildi'
        });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
