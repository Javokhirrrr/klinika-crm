import { Schema, model } from 'mongoose';

const doctorReviewSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },

    rating: { type: Number, min: 1, max: 5, required: true },

    comment: { type: String, trim: true },

    // Detailed ratings
    categories: {
        professionalism: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        waitTime: { type: Number, min: 1, max: 5 },
        facilities: { type: Number, min: 1, max: 5 }
    },

    isAnonymous: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },  // Admin moderation

    // Admin actions
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date }
}, { timestamps: true });

// Indexes
doctorReviewSchema.index({ orgId: 1, doctorId: 1, createdAt: -1 });
doctorReviewSchema.index({ orgId: 1, patientId: 1, appointmentId: 1 }, { unique: true, sparse: true });

export const DoctorReview = model('DoctorReview', doctorReviewSchema);
