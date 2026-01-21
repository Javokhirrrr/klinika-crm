import { Schema, model } from 'mongoose';

const appointmentReminderSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true, unique: true },

    enabled: { type: Boolean, default: true },

    // Communication channels
    channels: {
        sms: {
            enabled: { type: Boolean, default: false },
            provider: { type: String, enum: ['eskiz', 'playmobile', 'other'] },
            apiKey: { type: String },
            apiUrl: { type: String },
            senderName: { type: String, default: 'Klinika' }
        },
        telegram: {
            enabled: { type: Boolean, default: false },
            botToken: { type: String },
            botUsername: { type: String }
        },
        email: {
            enabled: { type: Boolean, default: false },
            fromEmail: { type: String },
            fromName: { type: String }
        }
    },

    // Reminder schedule
    schedule: [{
        timing: {
            type: String,
            enum: ['24h_before', '12h_before', '2h_before', '1h_before', '30min_before'],
            required: true
        },
        channel: {
            type: String,
            enum: ['sms', 'telegram', 'email'],
            required: true
        },
        enabled: { type: Boolean, default: true },
        template: { type: String, required: true }  // Template with variables: {patientName}, {doctorName}, {date}, {time}
    }]
}, { timestamps: true });

export const AppointmentReminder = model('AppointmentReminder', appointmentReminderSchema);
