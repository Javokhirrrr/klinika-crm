// src/routes/admin.routes.js
import { Router } from "express";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";

const r = Router();

/**
 * GET /api/admin/overview
 * -> { orgs, activeOrgs, users }
 */
r.get("/overview", async (_req, res) => {
  const [orgs, activeOrgs, users] = await Promise.all([
    Organization.countDocuments({}),
    Organization.countDocuments({ isActive: true }),
    User.countDocuments({}),
  ]);
  res.json({ orgs, activeOrgs, users });
});

/**
 * GET /api/admin/orgs
 * Query:
 *   page=1&limit=10
 *   name=...   (nom bo‘yicha qidirish, regex)
 *   code=...   (kod bo‘yicha qidirish, regex)
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 *   sort=createdAt:desc  (field:dir)
 *
 * Response:
 *   { items, total, page, limit, totals: { balance, credit } }
 */
r.get("/orgs", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const {
    name = "",
    code = "",
    from = "",
    to = "",
    sort = "createdAt:desc",
  } = req.query;

  const q = {};
  if (name.trim()) q.name = { $regex: name.trim(), $options: "i" };
  if (code.trim()) q.code = { $regex: code.trim(), $options: "i" };
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to + "T23:59:59.999Z");
  }

  const [sf, sd] = String(sort).split(":");
  const sortObj = sf ? { [sf]: sd === "asc" ? 1 : -1 } : { createdAt: -1 };

  const [items, total, sums] = await Promise.all([
    Organization.find(q)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select("_id name code createdAt balance credit")
      .lean(),
    Organization.countDocuments(q),
    Organization.aggregate([
      { $match: q },
      {
        $group: {
          _id: null,
          balance: { $sum: { $ifNull: ["$balance", 0] } },
          credit: { $sum: { $ifNull: ["$credit", 0] } },
        },
      },
    ]),
  ]);

  const totals = {
    balance: Number(sums?.[0]?.balance || 0),
    credit: Number(sums?.[0]?.credit || 0),
  };

  res.json({ items, total, page, limit, totals });
});

export default r;
