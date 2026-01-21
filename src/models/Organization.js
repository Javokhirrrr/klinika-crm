import { Schema, model } from 'mongoose';

const organizationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, minlength: 4, maxlength: 16 },  // Unique index created below
  slug: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  phone: String,
  address: String,
  isActive: { type: Boolean, default: true },
  balance: { type: Number, default: 0 }, // ixtiyoriy
}, { timestamps: true, versionKey: false });

organizationSchema.index({ code: 1 }, { unique: true });
organizationSchema.index({ name: 'text' });

export const Organization = model('Organization', organizationSchema);
