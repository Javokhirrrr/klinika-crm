import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { QueueEntry } from '../models/QueueEntry.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const orgId = req.user.orgId;

        // Date range
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Role-based filtering: If doctor, only show their own stats
        let doctorId = null;
        if (req.user.role === 'doctor') {
            const { Doctor } = await import('../models/Doctor.js');
            const doctor = await Doctor.findOne({
                orgId: req.user.orgId,
                userId: req.user._id,
                isDeleted: { $ne: true }
            }).lean();

            if (doctor) {
                doctorId = doctor._id;
            } else {
                // If user is a doctor but no doctor profile found, return zeros
                return res.json({
                    stats: { totalRevenue: 0, totalPatients: 0, totalAppointments: 0, todayQueue: 0 },
                    recentPayments: [],
                    monthlyRevenue: []
                });
            }
        }

        // Parallel queries
        const [
            totalRevenue,
            totalPatientsCount,
            totalAppointments,
            todayQueue,
            recentPayments,
            monthlyRevenue
        ] = await Promise.all([
            // Total revenue (for doctor: only their commissions' base amount or tied payments)
            Payment.aggregate([
                {
                    $match: {
                        orgId: new mongoose.Types.ObjectId(orgId),
                        ...(doctorId && {
                            appointmentId: {
                                $in: await (async () => {
                                    const { Appointment } = await import('../models/Appointment.js');
                                    const appts = await Appointment.find({ doctorId }).select('_id').lean();
                                    return appts.map(a => a._id);
                                })()
                            }
                        }),
                        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            // Total patients (for doctor: only their unique patients)
            doctorId ? (async () => {
                const { Appointment } = await import('../models/Appointment.js');
                const uniquePatients = await Appointment.distinct('patientId', { orgId, doctorId });
                return uniquePatients.length;
            })() : Patient.countDocuments({ orgId }),

            // Total appointments
            Appointment.countDocuments({
                orgId,
                ...(doctorId && { doctorId }),
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            }),

            // Today's queue
            QueueEntry.countDocuments({
                orgId,
                ...(doctorId && { doctorId }),
                status: { $in: ['waiting', 'called', 'in_service'] },
                joinedAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }),

            // Recent payments (last 5)
            (async () => {
                const query = { orgId };
                if (doctorId) {
                    const { Appointment } = await import('../models/Appointment.js');
                    const appts = await Appointment.find({ doctorId }).select('_id').lean();
                    query.appointmentId = { $in: appts.map(a => a._id) };
                }
                return Payment.find(query)
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('patientId', 'firstName lastName')
                    .lean();
            })(),

            // Monthly revenue (last 6 months)
            Payment.aggregate([
                {
                    $match: {
                        orgId: new mongoose.Types.ObjectId(orgId),
                        ...(doctorId && {
                            appointmentId: {
                                $in: await (async () => {
                                    const { Appointment } = await import('../models/Appointment.js');
                                    const appts = await Appointment.find({ doctorId }).select('_id').lean();
                                    return appts.map(a => a._id);
                                })()
                            }
                        }),
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        res.json({
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalPatients: totalPatientsCount,
                totalAppointments,
                todayQueue
            },
            recentPayments,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get financial report
 */
export const getFinancialReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const orgId = req.user.orgId;

        const match = { orgId: new mongoose.Types.ObjectId(orgId) };

        // Role-based filtering: If doctor, only show their own revenue
        if (req.user.role === 'doctor') {
            const { Doctor } = await import('../models/Doctor.js');
            const doctor = await Doctor.findOne({ orgId, userId: req.user._id, isDeleted: { $ne: true } }).lean();
            if (doctor) {
                const { Appointment } = await import('../models/Appointment.js');
                const appts = await Appointment.find({ doctorId: doctor._id }).select('_id').lean();
                match.appointmentId = { $in: appts.map(a => a._id) };
            } else {
                return res.json({ revenue: [] });
            }
        }

        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        let groupId;
        if (groupBy === 'month') {
            groupId = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
        } else if (groupBy === 'week') {
            groupId = {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
        } else {
            groupId = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
        }

        const revenue = await Payment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupId,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    cash: {
                        $sum: {
                            $cond: [{ $eq: ['$method', 'cash'] }, '$amount', 0]
                        }
                    },
                    card: {
                        $sum: {
                            $cond: [{ $eq: ['$method', 'card'] }, '$amount', 0]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({ revenue });
    } catch (error) {
        console.error('Financial report error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get patient statistics
 */
export const getPatientStats = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        let doctorId = null;

        if (req.user.role === 'doctor') {
            const { Doctor } = await import('../models/Doctor.js');
            const doctor = await Doctor.findOne({ orgId, userId: req.user._id, isDeleted: { $ne: true } }).lean();
            if (doctor) doctorId = doctor._id;
            else return res.json({ totalPatients: 0, newPatientsThisMonth: 0, patientsByGender: [], topPatients: [] });
        }

        const [
            totalPatientsCount,
            newPatientsThisMonth,
            patientsByGender,
            topPatients
        ] = await Promise.all([
            // Total patients
            doctorId ? (async () => {
                const { Appointment } = await import('../models/Appointment.js');
                const uniquePatients = await Appointment.distinct('patientId', { orgId, doctorId });
                return uniquePatients.length;
            })() : Patient.countDocuments({ orgId }),

            // New patients this month
            doctorId ? (async () => {
                const { Appointment } = await import('../models/Appointment.js');
                const startOfMonth = new Date(new Date().setDate(1));
                const uniquePatients = await Appointment.distinct('patientId', {
                    orgId, doctorId, createdAt: { $gte: startOfMonth }
                });
                return uniquePatients.length;
            })() : Patient.countDocuments({
                orgId,
                createdAt: { $gte: new Date(new Date().setDate(1)) }
            }),

            // Patients by gender
            doctorId ? (async () => {
                const { Appointment } = await import('../models/Appointment.js');
                const uniquePatients = await Appointment.distinct('patientId', { orgId, doctorId });
                return Patient.aggregate([
                    { $match: { _id: { $in: uniquePatients } } },
                    { $group: { _id: '$gender', count: { $sum: 1 } } }
                ]);
            })() : Patient.aggregate([
                { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]),

            // Top patients by visits
            Appointment.aggregate([
                { $match: { orgId: new mongoose.Types.ObjectId(orgId), ...(doctorId && { doctorId }) } },
                { $group: { _id: '$patientId', visits: { $sum: 1 } } },
                { $sort: { visits: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'patients',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'patient'
                    }
                },
                { $unwind: '$patient' },
                {
                    $project: {
                        patientId: '$_id',
                        visits: 1,
                        name: { $concat: ['$patient.firstName', ' ', '$patient.lastName'] }
                    }
                }
            ])
        ]);

        res.json({
            totalPatients: totalPatientsCount,
            newPatientsThisMonth,
            patientsByGender,
            topPatients
        });
    } catch (error) {
        console.error('Patient stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get doctor performance
 */
export const getDoctorPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const orgId = req.user.orgId;

        const match = { orgId: new mongoose.Types.ObjectId(orgId) };

        // Role-based filtering: If doctor, only show their own performance
        if (req.user.role === 'doctor') {
            const { Doctor } = await import('../models/Doctor.js');
            const doctor = await Doctor.findOne({ orgId, userId: req.user._id, isDeleted: { $ne: true } }).lean();
            if (doctor) match.doctorId = doctor._id;
            else return res.json({ performance: [] });
        }

        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const performance = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$doctorId',
                    totalAppointments: { $sum: 1 },
                    completedAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    doctorId: '$_id',
                    doctorName: { $concat: [{ $ifNull: ['$doctor.firstName', 'Unknown'] }, ' ', { $ifNull: ['$doctor.lastName', ''] }] },
                    totalAppointments: 1,
                    completedAppointments: 1,
                    completionRate: {
                        $cond: [
                            { $eq: ['$totalAppointments', 0] },
                            0,
                            { $multiply: [{ $divide: ['$completedAppointments', '$totalAppointments'] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { totalAppointments: -1 } }
        ]);

        res.json({ performance });
    } catch (error) {
        console.error('Doctor performance error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
