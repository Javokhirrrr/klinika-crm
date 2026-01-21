import mongoose, { Schema, model } from "mongoose";

const patientSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true, required: true },

    // Basic Information
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], lowercase: true },
    notes: { type: String },
    complaint: { type: String, trim: true },            // shikoyati
    cardNo: { type: String, trim: true, index: true }, // karta raqami (org ichida unique)

    // Enhanced Fields
    avatar: { type: String },  // Profile photo URL
    address: { type: String, trim: true },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null] },
    allergies: [{ type: String, trim: true }],
    chronicDiseases: [{ type: String, trim: true }],

    // Emergency Contact
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true }
    },

    // Insurance Information
    insuranceInfo: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      validUntil: { type: Date },
      coverageType: { type: String, trim: true }
    },

    // Documents
    documents: [{
      type: { type: String, enum: ['passport', 'insurance_card', 'medical_report', 'lab_result', 'prescription', 'other'] },
      filename: { type: String },
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }],

    // Tags and Preferences
    tags: [{ type: String, trim: true }],  // VIP, diabetic, etc.
    preferredLanguage: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz' },
    marketingConsent: { type: Boolean, default: false },

    // Analytics
    lastVisit: { type: Date },
    totalVisits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    // Telegram Integration
    telegramChatId: { type: String, default: null, index: true },
    telegramUsername: { type: String, default: null },
    telegramVerified: { type: Boolean, default: false },
    telegramVerifiedAt: { type: Date },

    // Soft Delete
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

// Telefon bo'yicha unique (o‘chirilmaganlar uchun)
patientSchema.index(
  { orgId: 1, phone: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: { $ne: true } } }
);

// Karta raqami bo'yicha ham unique (agar berilgan bo'lsa)
patientSchema.index(
  { orgId: 1, cardNo: 1 },
  { unique: true, sparse: true, partialFilterExpression: { cardNo: { $type: "string" } } }
);

// Agar cardNo yo'q bo'lsa — avtomatik generatsiya (org ichida unique bo'lguncha urinadi)
patientSchema.pre("save", async function (next) {
  if (this.cardNo) return next();
  try {
    for (let i = 0; i < 5; i++) {
      const candidate = "C" + (Date.now() % 1e8).toString().padStart(8, "0");
      const exists = await mongoose.model("Patient").exists({ orgId: this.orgId, cardNo: candidate });
      if (!exists) {
        this.cardNo = candidate;
        return next();
      }
    }
    return next(); // agar 5 martada ham bo'lmasa, cardNo bo'sh qoladi
  } catch (e) {
    return next(); // cardNo majburiy emas
  }
});

export const Patient = model("Patient", patientSchema);
