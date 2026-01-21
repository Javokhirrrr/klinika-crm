// src/models/Doctor.js
import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },

    firstName: { type: String, required: true, trim: true, index: true },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "", index: true },
    email: { type: String, trim: true, lowercase: true },
    spec: { type: String, trim: true, default: "", index: true },
    room: { type: String, trim: true, default: "" },  // kabinet raqami
    percent: { type: Number, default: 0 },               // xizmatdan foiz

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },

    note: { type: String, trim: true, default: "" },

    // Enhanced Fields
    avatar: { type: String, trim: true },

    // Ratings
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 },

    // Multiple specializations
    specializations: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],

    // Education
    education: [{
      degree: { type: String, trim: true },
      institution: { type: String, trim: true },
      year: { type: Number }
    }],

    experience: { type: Number },  // Years of experience
    bio: { type: String, trim: true },

    // Consultation
    consultationFee: { type: Number, min: 0 },

    // Online Booking
    availableForOnlineBooking: { type: Boolean, default: true },
    maxPatientsPerDay: { type: Number },

    // Break Time
    breakTime: {
      start: { type: String },  // e.g., "13:00"
      end: { type: String }     // e.g., "14:00"
    },

    // Commission Settings
    commissionRate: { type: Number, min: 0, max: 100, default: 0 },
    commissionEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// orgId + ism/telefon bo‘yicha tezkor qidiruvlar uchun indekslar
DoctorSchema.index({ orgId: 1, firstName: 1, lastName: 1 });
DoctorSchema.index({ orgId: 1, phone: 1 });
DoctorSchema.index({ orgId: 1, spec: 1, isActive: 1, isDeleted: 1 });

export const Doctor = mongoose.model("Doctor", DoctorSchema);
