import { Schema, model } from 'mongoose';

const treatmentItemSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  name: { type: String, required: true },           // Nusxa, agar service o'chib ketsa saqlab qolish uchun
  tooth: { type: String, trim: true },              // Ixtiyoriy, tish raqami (masalan "11", "24")
  quantity: { type: Number, required: true, default: 1, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  status: { 
    type: String, 
    enum: ['planned', 'in_progress', 'completed'], 
    default: 'planned' 
  },
  completedAt: { type: Date }                       // Bajarilgan vaqti
});

const treatmentPlanSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true }, // Mas'ul shifokor
    
    diagnosis: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },

    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    
    items: [treatmentItemSchema],
    
    totalCost: { type: Number, default: 0 },        // Jami xizmatlar narxi (chegirmalar ayrilgan holda)
    paidAmount: { type: Number, default: 0 },       // Bemor qancha to'lagan (Payment modeli orqali sinxronlanishi ham mumkin)
    
    progress: { type: Number, default: 0, min: 0, max: 100 }, // Necha foizi tugallangan (completed)

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);

treatmentPlanSchema.index({ orgId: 1, patientId: 1 });
treatmentPlanSchema.index({ orgId: 1, status: 1 });

// Saqlashdan oldin avtomatik hisob-kitob qilish
treatmentPlanSchema.pre('validate', function (next) {
  // Jami summani hisoblash
  let totalCost = 0;
  let completedCount = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      // Har bir itemning to'liq summasi:
      item.totalAmount = Math.max(0, (item.price * item.quantity) - item.discount);
      totalCost += item.totalAmount;
      
      if (item.status === 'completed') {
        completedCount++;
        if (!item.completedAt) item.completedAt = new Date();
      } else {
        item.completedAt = undefined;
      }
    });

    // Progress foizda:
    this.progress = Math.round((completedCount / this.items.length) * 100);
  } else {
    this.progress = 0;
  }

  this.totalCost = totalCost;

  // Agar barcha xizmatlar completed yoki reja o'zi statusi completed bo'lsa
  if (this.progress === 100 && this.status === 'active') {
    this.status = 'completed';
  } else if (this.progress < 100 && this.status === 'completed') {
    this.status = 'active'; 
  }

  next();
});

export const TreatmentPlan = model('TreatmentPlan', treatmentPlanSchema);

