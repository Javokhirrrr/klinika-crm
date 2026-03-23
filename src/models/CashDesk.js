import { Schema, model } from 'mongoose';

/**
 * CashDesk — Kassa hisobi
 * Har bir klinikada bir nechta kassa bo'lishi mumkin:
 * Naqd pul, Karta/POS, Bank hisobi, Sug'urta
 */
const cashDeskSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    name: { type: String, required: true, trim: true },          // "Bosh kassa", "POS terminal"
    type: {
      type: String,
      enum: ['cash', 'card', 'bank', 'insurance'],
      required: true,
      default: 'cash'
    },

    balance: { type: Number, default: 0 },                       // Joriy balans (so'm)
    currency: { type: String, enum: ['UZS', 'USD'], default: 'UZS' },

    description: { type: String, trim: true },                   // Ixtiyoriy izoh
    color: { type: String, default: '#3B82F6' },                 // UI rangi

    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

cashDeskSchema.index({ orgId: 1, type: 1 });

export const CashDesk = model('CashDesk', cashDeskSchema);
