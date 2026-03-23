import { CashDesk } from '../models/CashDesk.js';
import { CashTransaction } from '../models/CashTransaction.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOrgId = (req) => req.user?.orgId;
const getUserId = (req) => req.user?._id || req.user?.id;

// ─── Kassalar ────────────────────────────────────────────────────────────────

/** GET /api/cash-desks — Kassalar ro'yxati + balanslar */
export async function listDesks(req, res) {
  try {
    const orgId = getOrgId(req);
    const desks = await CashDesk.find({ orgId, isActive: true })
      .sort({ type: 1, name: 1 })
      .lean();

    // Jami balans
    const total = desks.reduce((sum, d) => sum + (d.balance || 0), 0);

    res.json({ desks, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** POST /api/cash-desks — Yangi kassa yaratish */
export async function createDesk(req, res) {
  try {
    const orgId = getOrgId(req);
    const { name, type, currency, description, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Kassa nomi va turi kiritilishi shart' });
    }

    const desk = await CashDesk.create({
      orgId,
      name: name.trim(),
      type,
      currency: currency || 'UZS',
      description,
      color: color || '#3B82F6',
      balance: 0,
      createdBy: getUserId(req),
    });

    res.status(201).json(desk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** PUT /api/cash-desks/:id — Kassani tahrirlash */
export async function updateDesk(req, res) {
  try {
    const orgId = getOrgId(req);
    const { name, description, color, isActive } = req.body;

    const desk = await CashDesk.findOneAndUpdate(
      { _id: req.params.id, orgId },
      { $set: { name, description, color, isActive } },
      { new: true, runValidators: true }
    );

    if (!desk) return res.status(404).json({ message: 'Kassa topilmadi' });
    res.json(desk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** DELETE /api/cash-desks/:id — Kassani o'chirish (soft) */
export async function deleteDesk(req, res) {
  try {
    const orgId = getOrgId(req);
    const desk = await CashDesk.findOne({ _id: req.params.id, orgId });
    if (!desk) return res.status(404).json({ message: 'Kassa topilmadi' });

    if (desk.balance !== 0) {
      return res.status(400).json({ message: `Kassada ${desk.balance.toLocaleString()} so'm bor. Avval nolga keltiring.` });
    }

    await CashDesk.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Kassa o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── Tranzaksiyalar ───────────────────────────────────────────────────────────

/** GET /api/cash-desks/transactions — Tranzaksiyalar ro'yxati */
export async function listTransactions(req, res) {
  try {
    const orgId = getOrgId(req);
    const {
      cashDeskId,
      type,
      category,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { orgId };
    if (cashDeskId) filter.cashDeskId = cashDeskId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      CashTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('cashDeskId', 'name type color')
        .populate('relatedDeskId', 'name type')
        .populate('createdBy', 'name')
        .populate('patientId', 'firstName lastName cardNo')
        .lean(),
      CashTransaction.countDocuments(filter),
    ]);

    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** POST /api/cash-desks/transactions — Yangi tranzaksiya */
export async function createTransaction(req, res) {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const {
      cashDeskId,
      type,
      amount,
      category,
      description,
      relatedDeskId,
      patientId,
      doctorId,
      paymentId,
    } = req.body;

    if (!cashDeskId || !type || !amount) {
      return res.status(400).json({ message: 'cashDeskId, type va amount kiritilishi shart' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Summa musbat bo\'lishi kerak' });
    }

    // Kassani tekshirish
    const desk = await CashDesk.findOne({ _id: cashDeskId, orgId, isActive: true });
    if (!desk) return res.status(404).json({ message: 'Kassa topilmadi' });

    // Transfer uchun ikkinchi kassani tekshirish
    let relatedDesk = null;
    if (type === 'transfer_out' || type === 'transfer_in') {
      if (!relatedDeskId) {
        return res.status(400).json({ message: 'O\'tkazma uchun manba yoki manzil kassani tanlang' });
      }
      relatedDesk = await CashDesk.findOne({ _id: relatedDeskId, orgId, isActive: true });
      if (!relatedDesk) return res.status(404).json({ message: 'Qabul qiluvchi kassa topilmadi' });
    }

    // Chiqim / o'tkazma uchun yetarli mablag' borligini tekshirish
    if ((type === 'expense' || type === 'transfer_out' || type === 'salary_payout') && desk.balance < amount) {
      return res.status(400).json({
        message: `Kassada yetarli mablag' yo'q. Mavjud: ${desk.balance.toLocaleString()} so'm`
      });
    }

    // Balansni yangilash
    let newBalance = desk.balance;
    if (type === 'income' || type === 'transfer_in') {
      newBalance += amount;
    } else if (type === 'expense' || type === 'transfer_out' || type === 'salary_payout') {
      newBalance -= amount;
    }

    await CashDesk.findByIdAndUpdate(cashDeskId, { balance: newBalance });

    // O'tkazma bo'lsa — ikkinchi kassani ham yangilash
    if (type === 'transfer_out' && relatedDesk) {
      await CashDesk.findByIdAndUpdate(relatedDeskId, {
        balance: relatedDesk.balance + amount
      });
      // Ikkinchi kassaga transfer_in tranzaksiyasi
      await CashTransaction.create({
        orgId,
        cashDeskId: relatedDeskId,
        type: 'transfer_in',
        amount,
        category: 'internal_transfer',
        description: `${desk.name}dan o'tkazma`,
        relatedDeskId: cashDeskId,
        balanceAfter: relatedDesk.balance + amount,
        createdBy: userId,
      });
    }

    // Asosiy tranzaksiyani saqlash
    const tx = await CashTransaction.create({
      orgId,
      cashDeskId,
      type,
      amount,
      category: category || (type === 'income' ? 'other_income' : type === 'expense' ? 'other_expense' : 'internal_transfer'),
      description,
      relatedDeskId: relatedDeskId || undefined,
      patientId: patientId || undefined,
      doctorId: doctorId || undefined,
      paymentId: paymentId || undefined,
      balanceAfter: newBalance,
      createdBy: userId,
    });

    const populated = await CashTransaction.findById(tx._id)
      .populate('cashDeskId', 'name type color')
      .populate('relatedDeskId', 'name type')
      .populate('createdBy', 'name')
      .lean();

    res.status(201).json({ transaction: populated, newBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── Statistika ───────────────────────────────────────────────────────────────

/** GET /api/cash-desks/stats — Oylik statistika */
export async function getStats(req, res) {
  try {
    const orgId = getOrgId(req);
    const now = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    const [desks, txSummary, last30] = await Promise.all([
      // Barcha kassalar
      CashDesk.find({ orgId, isActive: true }).lean(),

      // Oylik kirim/chiqim jami
      CashTransaction.aggregate([
        { $match: { orgId, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }}
      ]),

      // So'nggi 30 kun kunlik aylanma
      CashTransaction.aggregate([
        { $match: {
          orgId,
          type: { $in: ['income', 'expense'] },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }},
        { $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }},
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    const txSummary2 = await CashTransaction.aggregate([
      { $match: { orgId, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Jami kassalar balansi
    const totalBalance = desks.reduce((s, d) => s + (d.balance || 0), 0);

    // Oylik kirim / chiqim
    const income  = txSummary2.find(t => t._id === 'income')?.total  || 0;
    const expense = txSummary2.find(t => t._id === 'expense')?.total || 0;
    const salary  = txSummary2.find(t => t._id === 'salary_payout')?.total || 0;

    res.json({
      totalBalance,
      monthly: { income, expense, salary, net: income - expense - salary },
      desks,
      last30: last30,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
