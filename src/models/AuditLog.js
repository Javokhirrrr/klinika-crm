// src/models/AuditLog.js
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true },           // masalan: "create", "update", "delete"
  entity: { type: String, required: true },           // masalan: "Patient", "Appointment"
  entityId: { type: mongoose.Schema.Types.ObjectId }, // o‘sha modeldagi id
  details: { type: Object },                          // ixtiyoriy ma’lumotlar (old/new values)
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Indexlar (tezroq qidiruv uchun)
AuditLogSchema.index({ orgId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, entity: 1 });

// Model eksporti
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
