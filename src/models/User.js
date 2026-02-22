import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: String,

  role: { type: String, enum: ['owner', 'admin', 'reception', 'doctor', 'accountant', 'nurse', 'cashier'], default: 'reception' },
  globalRole: { type: String, enum: ['platform_admin', 'tenant_user', null], default: 'tenant_user' },

  // Permissions array for granular access control
  permissions: [{ type: String, trim: true }],

  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // Salary & Payroll
  baseSalary: { type: Number, min: 0, default: 0 }, // Fix oylik
  kpiBonus: { type: Number, min: 0, default: 0 }, // KPI bonusi (oylik)
  kpiCriteria: { type: String, trim: true }, // KPI mezonlari (tavsif)

  // Commission Settings (Shifokorlar uchun)
  commissionRate: { type: Number, min: 0, max: 100, default: 0 },
  commissionEnabled: { type: Boolean, default: false },

  // Slot Management (Shifokorlar uchun)
  shiftStart: { type: String, default: "09:00" }, // e.g. "09:00"
  shiftEnd: { type: String, default: "17:00" },   // e.g. "17:00"
  slotDuration: { type: Number, default: 20 },     // minutes
}, { timestamps: true, versionKey: false });

UserSchema.index({ orgId: 1, email: 1 }, { unique: true });

export const User = mongoose.model('User', UserSchema);
