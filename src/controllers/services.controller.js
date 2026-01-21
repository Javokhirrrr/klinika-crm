import { Service } from '../models/Service.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service.schema.js';
import { logAudit } from '../services/audit.js';
import { qOrg, withOrgFields } from '../utils/org.js';

export async function listServices(req, res) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.max(1, Number(req.query.limit ?? 50));
  const search = (req.query.search || req.query.q || '').trim();
  const ids = (req.query.ids || '').split(',').map(x => x.trim()).filter(Boolean);

  const q = {};
  const orgId = req.user?.orgId;

  // Org filter: match orgId OR missing orgId
  if (orgId) {
    q.$or = [{ orgId }, { orgId: { $exists: false } }, { orgId: null }];
  }

  if (ids.length) {
    q._id = { $in: ids };
  } else if (search) {
    const searchCond = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    };

    // Agar org filter ($or) mavjud bo'lsa, ikkalasini $and ga o'raymiz
    if (q.$or) {
      q.$and = [{ $or: q.$or }, searchCond];
      delete q.$or;
    } else {
      q.$or = searchCond.$or;
    }
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Service.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Service.countDocuments(q),
  ]);

  res.json({ items, total, page, limit });
}

export async function getService(req, res) {
  const doc = await Service.findOne(qOrg(req, { _id: req.params.id })).lean();
  if (!doc) return res.status(404).json({ message: 'Service not found' });
  res.json(doc);
}

export async function createService(req, res) {
  const { value, error } = createServiceSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const created = await Service.create(withOrgFields(req, {
    name: value.name,
    description: value.description || '',
    price: value.price,
    durationMinutes: value.durationMinutes,
  }));

  await logAudit({ userId: req.user?.uid, action: 'create', entity: 'service', entityId: created._id, meta: { name: created.name, price: created.price } });
  res.status(201).json({ id: created.id });
}

export async function updateService(req, res) {
  const { value, error } = updateServiceSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const updated = await Service.findOneAndUpdate(
    qOrg(req, { _id: req.params.id }),
    { $set: value },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: 'Service not found' });
  await logAudit({ userId: req.user?.uid, action: 'update', entity: 'service', entityId: updated._id, meta: { name: updated.name } });
  res.json(updated);
}

export async function deleteService(req, res) {
  const deleted = await Service.findOneAndDelete(qOrg(req, { _id: req.params.id })).lean();
  if (!deleted) return res.status(404).json({ message: 'Service not found' });
  await logAudit({ userId: req.user?.uid, action: 'delete', entity: 'service', entityId: deleted._id, meta: { name: deleted.name } });
  res.json({ ok: true });
}
