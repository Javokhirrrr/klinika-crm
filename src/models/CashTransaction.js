import { Schema, model } from 'mongoose';

/**
 * CashTransaction — Kassa tranzaksiyasi
 * Har bir kirim, chiqim yoki ichki o'tkazma shu yerda saqlanadi
 */
const cashTransactionSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    cashDeskId: { type: Schema.Types.ObjectId, ref: 'CashDesk', required: true, index: true },

    type: {
      type: String,
      enum: ['income', 'expense', 'transfer_in', 'transfer_out', 'salary_payout'],
      required: true
    },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['UZS', 'USD'], default: 'UZS' },

    category: {
      type: String,
      enum: [
        // Income categories
        'payment',        // Bemor to'lovi
        'deposit',        // Avans to'lov
        'other_income',   // Boshqa kirim

        // Expense categories
        'salary',         // Oylik
        'rent',           // Ijara
        'utilities',      // Kommunal xizmatlar
        'supplies',       // Sarflanadigan materiallar
        'equipment',      // Jihozlar
        'marketing',      // Reklama
        'other_expense',  // Boshqa chiqim

        // Transfer
        'internal_transfer', // Kassalar orasidagi o'tkazma
      ],
      default: 'other_income'
    },

    description: { type: String, trim: true },         // Izoh

    // Ichki o'tkazma uchun
    relatedDeskId: { type: Schema.Types.ObjectId, ref: 'CashDesk' }, // O'tkazma manbasi yoki manzili

    // To'lovdan bog'lash (ixtiyoriy)
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    doctorId:  { type: Schema.Types.ObjectId, ref: 'Doctor' },

    // Balans snapshot (tranzaksiyadan keyin)
    balanceAfter: { type: Number },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

cashTransactionSchema.index({ orgId: 1, createdAt: -1 });
cashTransactionSchema.index({ cashDeskId: 1, createdAt: -1 });
cashTransactionSchema.index({ orgId: 1, type: 1, createdAt: -1 });

export const CashTransaction = model('CashTransaction', cashTransactionSchema);
