// src/controllers/salary.controller.js
import { User } from '../models/User.js';
import { Commission } from '../models/Commission.js';
import { Attendance } from '../models/Attendance.js';

/**
 * GET /api/salaries
 * Barcha xodimlarning oylik maoshini hisoblash
 * Query params:
 *   - month: YYYY-MM format (default: current month)
 *   - userId: specific user ID (optional)
 */
export async function calculateSalaries(req, res) {
    try {
        const { month, userId } = req.query;
        const orgId = req.orgId;

        // Parse month or use current month
        let targetDate;
        if (month) {
            const [year, monthNum] = month.split('-');
            targetDate = new Date(year, monthNum - 1, 1);
        } else {
            targetDate = new Date();
        }

        const year = targetDate.getFullYear();
        const monthNum = targetDate.getMonth();
        const firstDay = new Date(year, monthNum, 1);
        const lastDay = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);

        // Get all active users in org (or specific user)
        const query = { orgId, isDeleted: { $ne: true }, isActive: true };

        // Role-based filtering: If doctor, only show their own salary
        if (req.user.role === 'doctor') {
            query._id = req.user._id;
        } else if (userId) {
            query._id = userId;
        }

        const users = await User.find(query).lean();

        const { Doctor } = await import('../models/Doctor.js');

        // Calculate salary for each user
        const salaries = await Promise.all(users.map(async (user) => {
            // 1. Base Salary (Fix oylik)
            const baseSalary = user.baseSalary || 0;

            // 2. KPI Bonus
            const kpiBonus = user.kpiBonus || 0;

            // 3. Commission — try to find doctor profile
            let commission = 0;
            let commissionDetails = { pending: 0, paid: 0 };
            let commissionRate = user.commissionRate || 0;

            // Find doctor profile by userId
            let doctor = await Doctor.findOne({
                orgId,
                userId: user._id,
                isDeleted: { $ne: true }
            }).lean();

            // Fallback: find by name if no userId link
            if (!doctor && user.role === 'doctor') {
                const nameParts = (user.name || '').split(' ');
                if (nameParts.length > 0) {
                    doctor = await Doctor.findOne({
                        orgId,
                        firstName: new RegExp(nameParts[0], 'i'),
                        isDeleted: { $ne: true }
                    }).lean();
                }
            }

            if (doctor) {
                // Use Doctor model's rate (both fields supported: commissionRate and percent)
                commissionRate = doctor.commissionRate || doctor.percent || user.commissionRate || 0;

                // Search commissions by BOTH doctorId AND userId to catch all records
                const commissionQuery = {
                    orgId,
                    $or: [
                        { doctorId: doctor._id },
                        { userId: doctor.userId || user._id }
                    ],
                    createdAt: { $gte: firstDay, $lte: lastDay }
                };

                const commissions = await Commission.find(commissionQuery).lean();

                // Deduplicate by _id (in case both conditions match same record)
                const uniqueCommissions = Array.from(
                    new Map(commissions.map(c => [String(c._id), c])).values()
                );

                uniqueCommissions.forEach(c => {
                    if (c.status === 'paid') {
                        commissionDetails.paid += c.amount || 0;
                    } else if (c.status === 'pending' || c.status === 'approved') {
                        commissionDetails.pending += c.amount || 0;
                    }
                    // 'cancelled' is excluded
                });

                commission = commissionDetails.paid + commissionDetails.pending;
            }

            // 4. Attendance
            const attendanceRecords = await Attendance.find({
                orgId,
                userId: user._id,
                date: { $gte: firstDay, $lte: lastDay }
            }).lean();

            const workDays = attendanceRecords.length;
            const expectedWorkDays = getWorkingDaysInMonth(year, monthNum);

            const attendanceBonus = 0;

            // Total Salary
            const totalSalary = baseSalary + kpiBonus + commission + attendanceBonus;

            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                baseSalary,
                kpiBonus,
                kpiCriteria: user.kpiCriteria || '',
                commission,
                commissionPending: commissionDetails.pending,
                commissionPaid: commissionDetails.paid,
                commissionRate,
                commissionEnabled: commissionRate > 0,
                attendanceBonus,
                workDays,
                expectedWorkDays,
                totalSalary,
                month: `${year}-${String(monthNum + 1).padStart(2, '0')}`
            };
        }));

        res.json({
            month: `${year}-${String(monthNum + 1).padStart(2, '0')}`,
            salaries,
            total: salaries.reduce((sum, s) => sum + s.totalSalary, 0)
        });
    } catch (e) {
        console.error('calculateSalaries error:', e);
        return res.status(500).json({ message: 'Internal error' });
    }
}

/**
 * PUT /api/salaries/:userId
 * Update user salary settings — also syncs to Doctor model for doctors
 */
export async function updateUserSalary(req, res) {
    try {
        const { userId } = req.params;
        const { baseSalary, kpiBonus, kpiCriteria, commissionRate, commissionEnabled } = req.body;

        const updates = {};
        if (baseSalary !== undefined) updates.baseSalary = Number(baseSalary) || 0;
        if (kpiBonus !== undefined) updates.kpiBonus = Number(kpiBonus) || 0;
        if (kpiCriteria !== undefined) updates.kpiCriteria = kpiCriteria;
        if (commissionRate !== undefined) updates.commissionRate = Number(commissionRate) || 0;
        if (commissionEnabled !== undefined) updates.commissionEnabled = !!commissionEnabled;

        const updated = await User.findOneAndUpdate(
            { _id: userId, orgId: req.orgId },
            { $set: updates },
            { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'User not found' });

        // ✅ IMPORTANT: If this user is a doctor, also sync to Doctor model
        // because payments.controller reads commission from Doctor.commissionRate / Doctor.percent
        if (updated.role === 'doctor' && commissionRate !== undefined) {
            const { Doctor } = await import('../models/Doctor.js');
            const rate = Number(commissionRate) || 0;
            const enabled = commissionEnabled !== undefined ? !!commissionEnabled : (rate > 0);

            await Doctor.findOneAndUpdate(
                { orgId: req.orgId, userId: updated._id },
                {
                    $set: {
                        commissionRate: rate,
                        commissionEnabled: enabled,
                        percent: rate  // sync legacy percent field too
                    }
                }
            );
        }

        res.json({
            userId: updated._id,
            name: updated.name,
            baseSalary: updated.baseSalary,
            kpiBonus: updated.kpiBonus,
            kpiCriteria: updated.kpiCriteria,
            commissionRate: updates.commissionRate ?? updated.commissionRate,
            commissionEnabled: updates.commissionEnabled ?? updated.commissionEnabled
        });
    } catch (e) {
        console.error('updateUserSalary error:', e);
        return res.status(500).json({ message: 'Internal error' });
    }
}

/**
 * GET /api/salaries/summary
 * Oylik xarajatlar summasi
 */
export async function getSalarySummary(req, res) {
    try {
        const { month } = req.query;
        const orgId = req.orgId;

        let targetDate;
        if (month) {
            const [year, monthNum] = month.split('-');
            targetDate = new Date(year, monthNum - 1, 1);
        } else {
            targetDate = new Date();
        }

        const year = targetDate.getFullYear();
        const monthNum = targetDate.getMonth();
        const firstDay = new Date(year, monthNum, 1);
        const lastDay = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);

        const query = {
            orgId,
            isDeleted: { $ne: true },
            isActive: true
        };

        if (req.user.role === 'doctor') {
            query._id = req.user._id;
        }

        const users = await User.find(query).lean();
        const { Doctor } = await import('../models/Doctor.js');

        let totalBaseSalary = 0;
        let totalKpiBonus = 0;
        let totalCommission = 0;

        for (const user of users) {
            totalBaseSalary += user.baseSalary || 0;
            totalKpiBonus += user.kpiBonus || 0;

            const doctor = await Doctor.findOne({
                orgId,
                userId: user._id,
                isDeleted: { $ne: true }
            }).lean();

            if (doctor) {
                // Search by both doctorId and userId
                const commissions = await Commission.find({
                    orgId,
                    $or: [
                        { doctorId: doctor._id },
                        { userId: doctor.userId || user._id }
                    ],
                    createdAt: { $gte: firstDay, $lte: lastDay },
                    status: { $ne: 'cancelled' }
                }).lean();

                const unique = Array.from(
                    new Map(commissions.map(c => [String(c._id), c])).values()
                );

                totalCommission += unique.reduce((sum, c) => sum + (c.amount || 0), 0);
            }
        }

        const totalSalary = totalBaseSalary + totalKpiBonus + totalCommission;

        res.json({
            month: `${year}-${String(monthNum + 1).padStart(2, '0')}`,
            summary: {
                totalBaseSalary,
                totalKpiBonus,
                totalCommission,
                totalSalary,
                employeeCount: users.length
            }
        });
    } catch (e) {
        console.error('getSalarySummary error:', e);
        return res.status(500).json({ message: 'Internal error' });
    }
}

// Helper: Get working days in month (excluding Sundays)
function getWorkingDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let workingDays = 0;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) {
            workingDays++;
        }
    }

    return workingDays;
}
