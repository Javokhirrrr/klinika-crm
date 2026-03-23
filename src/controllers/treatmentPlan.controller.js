import { TreatmentPlan } from '../models/TreatmentPlan.js';

const getOrgId = (req) => req.user?.orgId;
const getUserId = (req) => req.user?._id || req.user?.id;

// ─── GET: Rejalarni olish ──────────────────────────────────────────────────
export async function listPlans(req, res) {
  try {
    const orgId = getOrgId(req);
    const { patientId, doctorId, status, search } = req.query;

    const filter = { orgId };
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    if (search) filter.diagnosis = { $regex: search, $options: 'i' };

    const plans = await TreatmentPlan.find(filter)
      .populate('patientId', 'firstName lastName phone cardNo')
      .populate('doctorId', 'firstName lastName specialty')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── GET: Bitta rejani olish ───────────────────────────────────────────────
export async function getPlan(req, res) {
  try {
    const orgId = getOrgId(req);
    const plan = await TreatmentPlan.findOne({ _id: req.params.id, orgId })
      .populate('patientId', 'firstName lastName phone cardNo')
      .populate('doctorId', 'firstName lastName specialty')
      .lean();

    if (!plan) return res.status(404).json({ message: 'Davolash rejasi topilmadi' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── POST: Yangi reja yaratish ─────────────────────────────────────────────
export async function createPlan(req, res) {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const { patientId, doctorId, diagnosis, notes, items } = req.body;

    if (!patientId || !doctorId || !diagnosis || !items || !items.length) {
      return res.status(400).json({ message: 'Bemor, shifokor, diagnoz va kamida bitta xizmat kiritilishi shart' });
    }

    const plan = new TreatmentPlan({
      orgId,
      patientId,
      doctorId,
      diagnosis,
      notes,
      items,
      createdBy: userId,
    });

    await plan.save(); // pre-save yordamida progress va totalCost hisoblanadi

    const populated = await TreatmentPlan.findById(plan._id)
      .populate('patientId', 'firstName lastName phone')
      .populate('doctorId', 'firstName lastName')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── PUT: Rejani tahrirlash (diagnos yoki xizmatlarni yangilash) ──────────
export async function updatePlan(req, res) {
  try {
    const orgId = getOrgId(req);
    const { diagnosis, notes, status, items } = req.body;

    const plan = await TreatmentPlan.findOne({ _id: req.params.id, orgId });
    if (!plan) return res.status(404).json({ message: 'Davolash rejasi topilmadi' });

    if (diagnosis) plan.diagnosis = diagnosis;
    if (notes !== undefined) plan.notes = notes;
    if (status) plan.status = status;
    if (items) plan.items = items; // yangilangan xizmatlar ro'yxati

    await plan.save(); // pre-save qismini ishga tushiradi (hisob-kitoblar keladi)

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── PATCH: Alohida xizmat statusini yangilash (Checked qilish) ───────────
export async function updateItemStatus(req, res) {
  try {
    const orgId = getOrgId(req);
    const { id, itemId } = req.params;
    const { status } = req.body; // 'planned', 'in_progress', 'completed'

    if (!['planned', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Yaroqsiz status" });
    }

    const plan = await TreatmentPlan.findOne({ _id: id, orgId });
    if (!plan) return res.status(404).json({ message: 'Davolash rejasi topilmadi' });

    const item = plan.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Xizmat topilmadi' });

    item.status = status;
    
    await plan.save(); // avtomatik progress yangilanadi

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─── DELETE: Rejani o'chirish ──────────────────────────────────────────────
export async function deletePlan(req, res) {
  try {
    const orgId = getOrgId(req);
    const plan = await TreatmentPlan.findOneAndDelete({ _id: req.params.id, orgId });
    if (!plan) return res.status(404).json({ message: 'Davolash rejasi topilmadi' });
    res.json({ message: "O'chirildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
