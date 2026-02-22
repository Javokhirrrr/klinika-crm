// src/models/Doctor.js
import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },

    // Link to User account (for login access)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

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
    commissionEnabled: { type: Boolean, default: false },

    // Services (Xizmatlar)
    services: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      customPrice: { type: Number, min: 0 },  // Shifokor uchun maxsus narx
      isActive: { type: Boolean, default: true },
      addedAt: { type: Date, default: Date.now }
    }],

    // Real-time Status (Bandlik holati)
    currentStatus: {
      type: String,
      enum: ['available', 'busy', 'break', 'offline'],
      default: 'offline',
      index: true
    },
    lastStatusUpdate: { type: Date },
    currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    currentAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    // Work History (Ish tarixi)
    workHistory: [{
      organization: { type: String, trim: true },
      position: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String, trim: true },
      isCurrent: { type: Boolean, default: false }
    }],

    // Achievements (Yutuqlar)
    achievements: [{
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      date: { type: Date },
      icon: { type: String, trim: true }
    }],

    // Department (Bo'lim)
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    departmentName: { type: String, trim: true },  // Cache for quick access

    // ─── Onlayn Konsultatsiya (Video Call) ─────────────────────────────────────
    onlineConsultation: {
      enabled: { type: Boolean, default: false },
      price: { type: Number, min: 0, default: 0 },   // Video qabul narxi
      duration: { type: Number, default: 30 },         // Daqiqada (default 30 min)
      // Jitsi Meet — bepul, API kalit talab qilmaydi
      jitsiRoomPrefix: { type: String, trim: true },   // masalan: "dr-karimov" → meet.jit.si/dr-karimov-[appointmentId]
    },
    // Shifokor onlayn mavjud vaqtlari
    onlineAvailability: [{
      dayOfWeek: { type: Number, min: 0, max: 6 },  // 0=yakshanba, 1=dushanba...
      startTime: { type: String },                   // "09:00"
      endTime: { type: String }                      // "18:00"
    }]
  },
  { timestamps: true }
);

// orgId + ism/telefon bo‘yicha tezkor qidiruvlar uchun indekslar
DoctorSchema.index({ orgId: 1, firstName: 1, lastName: 1 });
DoctorSchema.index({ orgId: 1, phone: 1 });
DoctorSchema.index({ orgId: 1, spec: 1, isActive: 1, isDeleted: 1 });

export const Doctor = mongoose.model("Doctor", DoctorSchema);
