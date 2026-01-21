// src/controllers/system.controller.js
import { AuditLog } from '../models/AuditLog.js';
import client from 'prom-client';

// Prometheus default metrics (bir marta ishga tushadi)
const register = client.register;
let metricsStarted = false;
function ensureMetrics() {
  if (!metricsStarted) {
    client.collectDefaultMetrics({ register });
    metricsStarted = true;
  }
}

/* ---------- HEALTH CHECK ---------- */
export async function health(req, res) {
  try {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date(),
      memory: process.memoryUsage(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/* ---------- METRICS (Prometheus) ---------- */
export async function metrics(_req, res) {
  ensureMetrics();
  res.setHeader('Content-Type', register.contentType);
  const data = await register.metrics();
  res.end(data);
}

/* ---------- AUDIT LOGS (Admin uchun) ---------- */
export async function getLogs(req, res) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.max(1, Number(req.query.limit ?? 50));
  const { userId, action, entity, from, to } = req.query;

  const q = {};
  if (userId) q.userId = userId;
  if (action) q.action = action;
  if (entity) q.entity = entity;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(q),
  ]);

  res.json({ items, total, page, limit });
}
