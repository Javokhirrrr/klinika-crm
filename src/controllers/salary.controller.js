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

        // Calculate salary for each user
        const salaries = await Promise.all(users.map(async (user) => {
            // 1. Base Salary (Fix oylik)
            const baseSalary = user.baseSalary || 0;

            // 2. KPI Bonus (agar mavjud bo'lsa)
            const kpiBonus = user.kpiBonus || 0;

            // 3. Commission (har xil statusdagi commissionlar)
            let commission = 0;
            let commissionDetails = { pending: 0, paid: 0 };

            // Shifokor bo'lsa - commission hisoblaymiz
            const { Doctor } = await import('../models/Doctor.js');

            // Try to find doctor by userId first, then by name matching
            let doctor = await Doctor.findOne({
                orgId,
                userId: user._id,
                isDeleted: { $ne: true }
            }).lean();

            // If not found by userId, try finding by name (for doctors without user accounts)
            if (!doctor && user.role === 'doctor') {
                // Try to find doctor by name
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
                // Get ALL commissions for this doctor in this month (all statuses)
                const commissions = await Commission.find({
                    orgId,
                    doctorId: doctor._id,
                    createdAt: { $gte: firstDay, $lte: lastDay } // Changed from paidAt to createdAt
                }).lean();

                // Separate by status
                commissions.forEach(c => {
                    if (c.status === 'paid') {
                        commissionDetails.paid += c.amount || 0;
                    } else if (c.status === 'pending' || c.status === 'approved') {
                        commissionDetails.pending += c.amount || 0;
                    }
                });

                // Total commission (paid + pending)
                commission = commissionDetails.paid + commissionDetails.pending;
            }

            // 4. Attendance penalties (agar kerak bo'lsa)
            // Davomat asosida jarimalar hisoblanishi mumkin
            const attendanceRecords = await Attendance.find({
                orgId,
                userId: user._id,
                date: { $gte: firstDay, $lte: lastDay }
            }).lean();

            const workDays = attendanceRecords.length;
            const expectedWorkDays = getWorkingDaysInMonth(year, monthNum);

            // Attendance bonus/penalty (optional)
            let attendanceBonus = 0;
            if (workDays >= expectedWorkDays) {
                attendanceBonus = 0; // 100% attendance - no bonus/penalty
            } else {
                // Calculate proportional deduction (optional)
                // attendanceBonus = -((expectedWorkDays - workDays) * (baseSalary / expectedWorkDays));
            }

            // Total Salary
            const totalSalary = baseSalary + kpiBonus + commission + attendanceBonus;

            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                baseSalary,
                kpiBonus,
                kpiCriteria: user.kpiCriteria || '',
                commission,
                commissionRate: user.commissionRate || 0,
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
 * Update user salary settings
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

        res.json({
            userId: updated._id,
            name: updated.name,
            baseSalary: updated.baseSalary,
            kpiBonus: updated.kpiBonus,
            kpiCriteria: updated.kpiCriteria,
            commissionRate: updated.commissionRate,
            commissionEnabled: updated.commissionEnabled
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

        // Parse month
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

        // Get all active users
        const query = {
            orgId,
            isDeleted: { $ne: true },
            isActive: true
        };

        // Role-based filtering: If doctor, only show their own summary
        if (req.user.role === 'doctor') {
            query._id = req.user._id;
        }

        const users = await User.find(query).lean();

        let totalBaseSalary = 0;
        let totalKpiBonus = 0;
        let totalCommission = 0;

        for (const user of users) {
            totalBaseSalary += user.baseSalary || 0;
            totalKpiBonus += user.kpiBonus || 0;

            // Commission calculation - same logic as main function
            const { Doctor } = await import('../models/Doctor.js');

            let doctor = await Doctor.findOne({
                orgId,
                userId: user._id,
                isDeleted: { $ne: true }
            }).lean();

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
                const commissions = await Commission.find({
                    orgId,
                    doctorId: doctor._id,
                    createdAt: { $gte: firstDay, $lte: lastDay }
                }).lean();

                totalCommission += commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
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
        // Exclude Sundays (0 = Sunday)
        if (d.getDay() !== 0) {
            workingDays++;
        }
    }

    return workingDays;
}
