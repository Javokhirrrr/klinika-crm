import { Schema, model } from 'mongoose';

const commissionSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', index: true }, // NEW: for doctor commissions

    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },

    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    baseAmount: { type: Number, required: true, min: 0 },

    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Payment tracking
    paidAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'card'] },

    // Approval tracking
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // Cancellation
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true },

    notes: { type: String, trim: true }
}, { timestamps: true });

// Indexes
commissionSchema.index({ orgId: 1, userId: 1, status: 1, createdAt: -1 });
commissionSchema.index({ orgId: 1, paymentId: 1 });
commissionSchema.index({ orgId: 1, status: 1, createdAt: -1 });

export const Commission = model('Commission', commissionSchema);
