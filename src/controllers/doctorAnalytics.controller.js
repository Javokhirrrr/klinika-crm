// src/controllers/doctorAnalytics.controller.js
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Appointment } from "../models/Appointment.js";
import { Payment } from "../models/Payment.js";
import { DoctorWallet } from "../models/DoctorWallet.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** GET /api/analytics/doctors - Get doctors analytics */
export async function getDoctorsAnalytics(req, res) {
    const { from, to, limit = 10 } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(`${to}T23:59:59.999Z`);

    try {
        // Top doctors by appointment count
        const appointmentStats = await Appointment.aggregate([
            {
                $match: {
                    orgId: req.orgId,
                    status: { $in: ['done', 'paid'] },
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                }
            },
            {
                $group: {
                    _id: "$doctorId",
                    appointmentCount: { $sum: 1 },
                    totalRevenue: { $sum: "$price" }
                }
            },
            { $sort: { appointmentCount: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Populate doctor info
        const doctorIds = appointmentStats.map(s => s._id);
        const doctors = await Doctor.find({ _id: { $in: doctorIds } })
            .select('firstName lastName spec avatar rating')
            .lean();

        const doctorMap = {};
        doctors.forEach(d => {
            doctorMap[d._id.toString()] = d;
        });

        const topDoctors = appointmentStats.map(stat => ({
            doctor: doctorMap[stat._id.toString()],
            appointmentCount: stat.appointmentCount,
            totalRevenue: stat.totalRevenue || 0
        }));

        // Department stats
        const departmentStats = await Doctor.aggregate([
            {
                $match: {
                    orgId: req.orgId,
                    isDeleted: { $ne: true },
                    departmentName: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: "$departmentName",
                    doctorCount: { $sum: 1 },
                    avgRating: { $avg: "$rating" }
                }
            },
            { $sort: { doctorCount: -1 } }
        ]);

        // Status distribution
        const statusDistribution = await Doctor.aggregate([
            {
                $match: {
                    orgId: req.orgId,
                    isDeleted: { $ne: true },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: "$currentStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Specialization distribution
        const specializationStats = await Doctor.aggregate([
            {
                $match: {
                    orgId: req.orgId,
                    isDeleted: { $ne: true },
                    spec: { $exists: true, $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: "$spec",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            topDoctors,
            departmentStats,
            statusDistribution,
            specializationStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/** GET /api/analytics/doctors/:id - Get specific doctor analytics */
export async function getDoctorAnalytics(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(`${to}T23:59:59.999Z`);

    try {
        const doctor = await Doctor.findOne({
            _id: OID(id),
            orgId: req.orgId,
            isDeleted: { $ne: true }
        }).lean();

        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        // Appointment stats
        const appointmentFilter = {
            orgId: req.orgId,
            doctorId: OID(id),
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        };

        const [totalAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
            Appointment.countDocuments(appointmentFilter),
            Appointment.countDocuments({ ...appointmentFilter, status: { $in: ['done', 'paid'] } }),
            Appointment.countDocuments({ ...appointmentFilter, status: 'cancelled' })
        ]);

        // Revenue stats
        const revenueStats = await Payment.aggregate([
            {
                $match: {
                    orgId: req.orgId,
                    doctorId: OID(id),
                    status: 'completed',
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenue = revenueStats[0] || { totalRevenue: 0, count: 0 };

        // Wallet stats
        const wallet = await DoctorWallet.findOne({
            orgId: req.orgId,
            doctorId: OID(id)
        }).lean();

        // Monthly appointment trend
        const monthlyTrend = await Appointment.aggregate([
            {
                $match: appointmentFilter
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 }
        ]);

        // Service distribution
        const serviceStats = await Appointment.aggregate([
            {
                $match: {
                    ...appointmentFilter,
                    status: { $in: ['done', 'paid'] }
                }
            },
            { $unwind: "$serviceIds" },
            {
                $group: {
                    _id: "$serviceIds",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Populate service names
        const { Service } = await import('../models/Service.js');
        const serviceIds = serviceStats.map(s => s._id);
        const services = await Service.find({ _id: { $in: serviceIds } })
            .select('name')
            .lean();

        const serviceMap = {};
        services.forEach(s => {
            serviceMap[s._id.toString()] = s.name;
        });

        const topServices = serviceStats.map(stat => ({
            serviceName: serviceMap[stat._id.toString()] || 'Unknown',
            count: stat.count
        }));

        res.json({
            doctor: {
                _id: doctor._id,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                spec: doctor.spec,
                avatar: doctor.avatar,
                rating: doctor.rating,
                currentStatus: doctor.currentStatus
            },
            appointments: {
                total: totalAppointments,
                completed: completedAppointments,
                cancelled: cancelledAppointments,
                completionRate: totalAppointments > 0
                    ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
                    : 0
            },
            revenue: {
                total: revenue.totalRevenue,
                paymentCount: revenue.count,
                avgPerPayment: revenue.count > 0
                    ? (revenue.totalRevenue / revenue.count).toFixed(2)
                    : 0
            },
            wallet: wallet ? {
                balance: wallet.balance,
                totalEarned: wallet.totalEarned,
                totalWithdrawn: wallet.totalWithdrawn,
                totalBonus: wallet.totalBonus
            } : null,
            monthlyTrend,
            topServices
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
