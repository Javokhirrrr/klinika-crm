import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: String,

  role: { type: String, enum: ['owner', 'admin', 'reception', 'doctor', 'accountant'], default: 'admin' },
  globalRole: { type: String, enum: ['platform_admin', 'tenant_user', null], default: 'tenant_user' },

  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  // Commission Settings
  commissionRate: { type: Number, min: 0, max: 100, default: 0 },
  commissionEnabled: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

UserSchema.index({ orgId: 1, email: 1 }, { unique: true });

export const User = mongoose.model('User', UserSchema);
