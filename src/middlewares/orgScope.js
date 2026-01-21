// src/middlewares/orgScope.js
import mongoose from "mongoose";

/**
 * orgId ni req.user.orgId (JWT dan), yoki x-org-id header / cookie / query dan oladi.
 * Org bo'lmasa 400, noto'g'ri bo'lsa 400.
 * req.orgId — bu ObjectId bo'lib, barcha qidiruvlarga qo'shiladi.
 */
export function requireOrg(req, res, next) {
  const raw =
    req.user?.orgId ||
    req.headers["x-org-id"] ||
    req.cookies?.orgId ||
    req.query.orgId;

  if (!raw) return res.status(400).json({ message: "orgId is required" });
  if (!mongoose.isValidObjectId(raw)) {
    return res.status(400).json({ message: "Invalid orgId" });
  }

  req.orgId = new mongoose.Types.ObjectId(raw);
  next();
}
