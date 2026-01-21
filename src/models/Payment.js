import { Schema, model } from 'mongoose';

const paymentSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },

  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },

  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'bank_transfer', 'click', 'payme', 'uzcard', 'insurance', 'online'],
    required: true,
    default: 'cash'
  },
  status: { type: String, enum: ['completed', 'pending', 'failed', 'refunded'], default: 'completed' },
  note: String,

  // Enhanced Fields
  transactionId: { type: String, trim: true },  // External payment gateway transaction ID

  // Installment Plan
  isInstallment: { type: Boolean, default: false },
  installmentPlan: {
    totalAmount: { type: Number },
    downPayment: { type: Number },
    numberOfInstallments: { type: Number },
    installmentAmount: { type: Number },
    frequency: { type: String, enum: ['weekly', 'monthly'] },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  installmentPayments: [{
    dueDate: { type: Date },
    amount: { type: Number },
    paidDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue', 'cancelled'] },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' }
  }],
  parentPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },  // For installment payments

  // Insurance Claim
  insuranceClaim: {
    provider: { type: String, trim: true },
    claimNumber: { type: String, trim: true },
    claimAmount: { type: Number },
    approvedAmount: { type: Number },
    patientResponsibility: { type: Number },
    status: { type: String, enum: ['submitted', 'approved', 'rejected', 'paid'] },
    submittedAt: { type: Date },
    processedAt: { type: Date },
    notes: { type: String, trim: true }
  },

  // Invoice
  invoice: {
    invoiceNumber: { type: String, trim: true },
    invoiceDate: { type: Date },
    dueDate: { type: Date },
    pdfUrl: { type: String, trim: true }
  },

  // Refund
  refund: {
    amount: { type: Number },
    reason: { type: String, trim: true },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },

  // Payment processor details
  processorResponse: { type: Schema.Types.Mixed },  // Store gateway response

  // Receipt
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  receiptPath: { type: String, trim: true },
  receiptSentAt: { type: Date },
  receiptSentVia: {
    type: String,
    enum: ['telegram', 'email', 'sms'],
    default: 'telegram'
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: true, updatedAt: false } });

paymentSchema.index({ orgId: 1, createdAt: 1 });

export const Payment = model('Payment', paymentSchema);
