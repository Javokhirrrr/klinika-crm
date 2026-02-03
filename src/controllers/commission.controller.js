import { Commission } from '../models/Commission.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Get my earnings summary
 */
export const getMyEarnings = async (req, res) => {
    try {
        const userId = req.user._id;

        const [pending, approved, paid] = await Promise.all([
            Commission.aggregate([
                { $match: { orgId: req.user.orgId, userId, status: 'pending' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Commission.aggregate([
                { $match: { orgId: req.user.orgId, userId, status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Commission.aggregate([
                { $match: { orgId: req.user.orgId, userId, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            earnings: {
                pending: { amount: pending[0]?.total || 0, count: pending[0]?.count || 0 },
                approved: { amount: approved[0]?.total || 0, count: approved[0]?.count || 0 },
                paid: { amount: paid[0]?.total || 0, count: paid[0]?.count || 0 }
            }
        });
    } catch (error) {
        console.error('Get my earnings error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my commission history
 */
export const getMyHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, status, startDate, endDate } = req.query;

        const query = {
            orgId: req.user.orgId,
            userId
        };

        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [commissions, total] = await Promise.all([
            Commission.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('paymentId', 'amount method')
                .populate('patientId', 'firstName lastName'),
            Commission.countDocuments(query)
        ]);

        res.json({
            commissions,
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
 * Get all commissions (Admin only)
 */
export const getAllCommissions = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, status, startDate, endDate } = req.query;

        const query = { orgId: req.user.orgId };

        // Role-based filtering: If doctor, only show their own commissions
        if (req.user.role === 'doctor') {
            query.userId = req.user._id;
        } else if (userId) {
            query.userId = userId;
        }
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [commissions, total] = await Promise.all([
            Commission.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email role')
                .populate('paymentId', 'amount method')
                .populate('patientId', 'firstName lastName'),
            Commission.countDocuments(query)
        ]);

        res.json({
            commissions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all commissions error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get commission report (Admin only)
 */
export const getCommissionReport = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;

        if (!startDate || !endDate) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Boshlanish va tugash sanalarini kiriting'
            });
        }

        const query = {
            orgId: req.user.orgId,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (userId) query.userId = userId;

        const report = await Commission.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$userId',
                    totalCommissions: { $sum: '$amount' },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
                    },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
                    },
                    paid: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $sort: { totalCommissions: -1 } }
        ]);

        res.json({
            report,
            period: { startDate, endDate }
        });
    } catch (error) {
        console.error('Get commission report error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Approve commission (Admin only)
 */
export const approveCommission = async (req, res) => {
    try {
        const { id } = req.params;

        const commission = await Commission.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: 'pending'
        });

        if (!commission) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Foiz topilmadi yoki allaqachon tasdiqlangan'
            });
        }

        commission.status = 'approved';
        commission.approvedAt = new Date();
        commission.approvedBy = req.user._id;

        await commission.save();
        await commission.populate(['userId', 'paymentId', 'patientId']);

        res.json({
            message: 'Foiz tasdiqlandi',
            commission
        });
    } catch (error) {
        console.error('Approve commission error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Mark commission as paid (Admin only)
 */
export const payCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, notes } = req.body;

        const commission = await Commission.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: 'approved'
        });

        if (!commission) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Foiz topilmadi yoki hali tasdiqlanmagan'
            });
        }

        commission.status = 'paid';
        commission.paidAt = new Date();
        commission.paidBy = req.user._id;
        commission.paymentMethod = paymentMethod || 'cash';
        if (notes) commission.notes = notes;

        await commission.save();
        await commission.populate(['userId', 'paymentId', 'patientId']);

        res.json({
            message: 'Foiz to\'landi',
            commission
        });
    } catch (error) {
        console.error('Pay commission error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Cancel commission (Admin only)
 */
export const cancelCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const commission = await Commission.findOne({
            _id: id,
            orgId: req.user.orgId,
            status: { $in: ['pending', 'approved'] }
        });

        if (!commission) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Foiz topilmadi yoki allaqachon to\'langan'
            });
        }

        commission.status = 'cancelled';
        commission.cancelledAt = new Date();
        commission.cancelledBy = req.user._id;
        commission.cancellationReason = reason || 'Admin tomonidan bekor qilindi';

        await commission.save();
        await commission.populate(['userId', 'paymentId', 'patientId']);

        res.json({
            message: 'Foiz bekor qilindi',
            commission
        });
    } catch (error) {
        console.error('Cancel commission error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Update user commission settings (Admin only)
 */
export const updateUserCommissionSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { commissionRate, commissionEnabled } = req.body;

        const user = await User.findOne({
            _id: id,
            orgId: req.user.orgId
        });

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Foydalanuvchi topilmadi'
            });
        }

        if (commissionRate !== undefined) user.commissionRate = commissionRate;
        if (commissionEnabled !== undefined) user.commissionEnabled = commissionEnabled;

        await user.save();

        res.json({
            message: 'Foiz sozlamalari yangilandi',
            user: {
                _id: user._id,
                name: user.name,
                commissionRate: user.commissionRate,
                commissionEnabled: user.commissionEnabled
            }
        });
    } catch (error) {
        console.error('Update commission settings error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
