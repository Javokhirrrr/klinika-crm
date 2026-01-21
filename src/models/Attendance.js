import { Schema, model } from 'mongoose';

const attendanceSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    date: { type: Date, required: true, index: true },  // Date only (without time)

    clockIn: { type: Date, required: true },
    clockOut: { type: Date },

    workHours: { type: Number, default: 0 },  // Calculated in hours

    status: {
        type: String,
        enum: ['on_time', 'late', 'absent', 'half_day', 'working'],
        default: 'on_time'
    },

    lateMinutes: { type: Number, default: 0 },

    // Location tracking (optional)
    clockInLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },

    clockOutLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },

    notes: { type: String, trim: true },

    // Admin can manually edit
    isManualEntry: { type: Boolean, default: false },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    editReason: { type: String, trim: true }
}, { timestamps: true });

// Indexes
attendanceSchema.index({ orgId: 1, userId: 1, date: -1 });
attendanceSchema.index({ orgId: 1, date: -1, status: 1 });

// Ensure one attendance record per user per day
attendanceSchema.index({ orgId: 1, userId: 1, date: 1 }, { unique: true });

// Calculate work hours before saving
attendanceSchema.pre('save', function (next) {
    if (this.clockOut && this.clockIn) {
        const diff = this.clockOut - this.clockIn;
        this.workHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;  // Hours with 2 decimal places
    }
    next();
});

export const Attendance = model('Attendance', attendanceSchema);
