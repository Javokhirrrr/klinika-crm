import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },

  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, min: 0 }, // in minutes

  // Enhanced Fields
  category: { type: String, trim: true, index: true },  // e.g., "Consultation", "Lab Test", "Surgery"
  code: { type: String, trim: true },  // Service code for billing (index created separately below)
  description: { type: String, trim: true },

  isActive: { type: Boolean, default: true, index: true },
  requiresAppointment: { type: Boolean, default: true },
  estimatedDuration: { type: Number },  // in minutes (can override duration)
  preparationInstructions: { type: String, trim: true },

  availableForOnlineBooking: { type: Boolean, default: true },
  icon: { type: String, trim: true },  // Icon name or URL
  popularity: { type: Number, default: 0 },  // Track usage

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

serviceSchema.index({ orgId: 1, name: 1 });
serviceSchema.index({ code: 1 }, { unique: true, sparse: true });  // Unique service code
serviceSchema.index({ name: 'text', description: 'text' });

export const Service = model('Service', serviceSchema);
