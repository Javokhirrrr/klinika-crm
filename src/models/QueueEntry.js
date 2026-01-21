import { Schema, model } from 'mongoose';

const queueEntrySchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', index: true },

    queueNumber: { type: Number, required: true },

    priority: {
        type: String,
        enum: ['normal', 'urgent', 'emergency'],
        default: 'normal',
        index: true
    },

    status: {
        type: String,
        enum: ['waiting', 'called', 'in_service', 'completed', 'cancelled', 'no_show'],
        default: 'waiting',
        index: true
    },

    // Timestamps
    joinedAt: { type: Date, default: Date.now, required: true },
    calledAt: { type: Date },
    serviceStartedAt: { type: Date },
    completedAt: { type: Date },

    // Estimated wait time in minutes
    estimatedWaitTime: { type: Number },

    // Staff actions
    calledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    servedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // Cancellation
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true },

    notes: { type: String, trim: true }
}, { timestamps: true });

// Indexes
queueEntrySchema.index({ orgId: 1, status: 1, joinedAt: 1 });
queueEntrySchema.index({ orgId: 1, doctorId: 1, status: 1, joinedAt: 1 });
queueEntrySchema.index({ orgId: 1, queueNumber: 1, createdAt: -1 });

// Auto-increment queue number for the day
queueEntrySchema.pre('save', async function (next) {
    if (this.isNew && !this.queueNumber) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const lastEntry = await model('QueueEntry')
            .findOne({
                orgId: this.orgId,
                createdAt: { $gte: today, $lt: tomorrow }
            })
            .sort({ queueNumber: -1 });

        this.queueNumber = lastEntry ? lastEntry.queueNumber + 1 : 1;
    }
    next();
});

export const QueueEntry = model('QueueEntry', queueEntrySchema);
