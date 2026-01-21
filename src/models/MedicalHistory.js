import { Schema, model } from 'mongoose';

const medicalHistorySchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },

    date: { type: Date, required: true, index: true },
    type: {
        type: String,
        enum: ['diagnosis', 'treatment', 'prescription', 'lab_result', 'surgery', 'vaccination', 'note'],
        required: true
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },

    // Attachments
    attachments: [{
        filename: { type: String },
        url: { type: String },
        type: { type: String }
    }],

    // Medical Codes
    icd10Code: { type: String, trim: true },  // International disease classification

    // Medications
    medications: [{
        name: { type: String, required: true, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        duration: { type: String, trim: true },
        instructions: { type: String, trim: true }
    }],

    // Lab Results
    labResults: [{
        testName: { type: String, required: true, trim: true },
        result: { type: String, trim: true },
        unit: { type: String, trim: true },
        normalRange: { type: String, trim: true },
        status: { type: String, enum: ['normal', 'abnormal', 'critical'] }
    }],

    // Vital Signs
    vitalSigns: {
        bloodPressure: { type: String },  // e.g., "120/80"
        heartRate: { type: Number },
        temperature: { type: Number },
        weight: { type: Number },
        height: { type: Number },
        oxygenSaturation: { type: Number }
    }
}, { timestamps: true });

// Indexes for efficient queries
medicalHistorySchema.index({ orgId: 1, patientId: 1, date: -1 });
medicalHistorySchema.index({ orgId: 1, doctorId: 1, date: -1 });
medicalHistorySchema.index({ orgId: 1, type: 1, date: -1 });

export const MedicalHistory = model('MedicalHistory', medicalHistorySchema);
