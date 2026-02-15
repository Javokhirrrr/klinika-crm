// src/models/Department.js
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
    {
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },

        name: { type: String, required: true, trim: true, index: true },
        code: { type: String, trim: true, uppercase: true },  // e.g., "CARD", "DENT"
        description: { type: String, trim: true },

        // Head of Department
        headDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },

        // Location
        floor: { type: String, trim: true },
        building: { type: String, trim: true },
        roomNumbers: [{ type: String, trim: true }],

        // Contact
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },

        // Settings
        color: { type: String, trim: true, default: "#3b82f6" },  // For calendar/UI
        icon: { type: String, trim: true },

        // Status
        isActive: { type: Boolean, default: true, index: true },
        isDeleted: { type: Boolean, default: false, index: true },

        // Statistics (cached)
        doctorCount: { type: Number, default: 0 },
        patientCount: { type: Number, default: 0 },

        note: { type: String, trim: true }
    },
    { timestamps: true }
);

// Indekslar
DepartmentSchema.index({ orgId: 1, name: 1 });
DepartmentSchema.index({ orgId: 1, code: 1 }, { unique: true, sparse: true });
DepartmentSchema.index({ orgId: 1, isActive: 1, isDeleted: 1 });

export const Department = mongoose.model("Department", DepartmentSchema);
