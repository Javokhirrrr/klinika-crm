// src/controllers/doctorWallet.controller.js
import mongoose from "mongoose";
import { DoctorWallet } from "../models/DoctorWallet.js";
import { Doctor } from "../models/Doctor.js";

const okId = (v) => mongoose.isValidObjectId(v);
const OID = (v) => new mongoose.Types.ObjectId(v);

/** GET /api/doctors/:id/wallet - Get doctor's wallet */
export async function getDoctorWallet(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    // Verify doctor exists and belongs to org
    const doctor = await Doctor.findOne({ _id: OID(id), orgId: req.orgId, isDeleted: { $ne: true } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Get or create wallet
    let wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });

    if (!wallet) {
        wallet = await DoctorWallet.create({
            orgId: req.orgId,
            doctorId: OID(id),
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            totalBonus: 0,
            totalPenalty: 0,
            transactions: []
        });
    }

    res.json(wallet);
}

/** GET /api/doctors/:id/wallet/transactions - Get wallet transactions with pagination */
export async function getWalletTransactions(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const { type, from, to } = req.query;

    const wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    let transactions = wallet.transactions || [];

    // Filter by type
    if (type && type !== 'all') {
        transactions = transactions.filter(t => t.type === type);
    }

    // Filter by date range
    if (from || to) {
        transactions = transactions.filter(t => {
            const tDate = new Date(t.createdAt);
            if (from && tDate < new Date(from)) return false;
            if (to && tDate > new Date(`${to}T23:59:59.999Z`)) return false;
            return true;
        });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = transactions.length;
    const items = transactions.slice(skip, skip + limit);

    res.json({ items, total, page, limit });
}

/** POST /api/doctors/:id/wallet/withdrawal - Process withdrawal */
export async function processWithdrawal(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { amount, description = "" } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    try {
        await wallet.addWithdrawal(amount, description, req.userId);
        res.json({ ok: true, wallet });
    } catch (err) {
        res.status(400).json({ message: err.message || "Withdrawal failed" });
    }
}

/** POST /api/doctors/:id/wallet/bonus - Add bonus */
export async function addBonus(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { amount, description = "" } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });
    if (!wallet) {
        // Create wallet if not exists
        const newWallet = await DoctorWallet.create({
            orgId: req.orgId,
            doctorId: OID(id)
        });
        await newWallet.addBonus(amount, description, req.userId);
        return res.json({ ok: true, wallet: newWallet });
    }

    await wallet.addBonus(amount, description, req.userId);
    res.json({ ok: true, wallet });
}

/** POST /api/doctors/:id/wallet/penalty - Add penalty */
export async function addPenalty(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const { amount, description = "" } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    const wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    await wallet.addPenalty(amount, description, req.userId);
    res.json({ ok: true, wallet });
}

/** GET /api/doctors/:id/wallet/stats - Get wallet statistics */
export async function getWalletStats(req, res) {
    const { id } = req.params;
    if (!okId(id)) return res.status(400).json({ message: "Invalid doctor id" });

    const wallet = await DoctorWallet.findOne({ orgId: req.orgId, doctorId: OID(id) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // Calculate monthly stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthEarnings = wallet.monthlyEarnings.find(
        m => m.year === currentYear && m.month === currentMonth
    );

    // Last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const data = wallet.monthlyEarnings.find(m => m.year === year && m.month === month);
        last6Months.push({
            year,
            month,
            amount: data ? data.amount : 0
        });
    }

    // Transaction type breakdown
    const transactionsByType = {
        earning: 0,
        withdrawal: 0,
        bonus: 0,
        penalty: 0,
        adjustment: 0
    };

    wallet.transactions.forEach(t => {
        if (transactionsByType.hasOwnProperty(t.type)) {
            transactionsByType[t.type] += Math.abs(t.amount);
        }
    });

    res.json({
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        totalBonus: wallet.totalBonus,
        totalPenalty: wallet.totalPenalty,
        currentMonthEarnings: currentMonthEarnings ? currentMonthEarnings.amount : 0,
        last6Months,
        transactionsByType,
        lastTransactionDate: wallet.lastTransactionDate,
        lastWithdrawalDate: wallet.lastWithdrawalDate
    });
}

/** GET /api/wallets/top - Get top earning doctors */
export async function getTopEarningDoctors(req, res) {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const wallets = await DoctorWallet.find({ orgId: req.orgId, isActive: true })
        .sort({ totalEarned: -1 })
        .limit(limit)
        .populate('doctorId', 'firstName lastName spec avatar')
        .lean();

    res.json({ items: wallets });
}
