// src/models/DoctorCertificate.js
import mongoose from "mongoose";

const DoctorCertificateSchema = new mongoose.Schema(
  {
    orgId:    { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", index: true, required: true },

    originalName: { type: String, required: true },
    name:         { type: String, required: true }, // diskdagi nom
    mimetype:     { type: String, default: "application/pdf" },
    size:         { type: Number, default: 0 },

    // public (nisbiy) URL: /uploads/doctors/<doctorId>/<file>
    url:          { type: String, required: true },
    // diskdagi to‘liq yo‘l
    path:         { type: String, required: true },
  },
  { timestamps: true }
);

DoctorCertificateSchema.index({ orgId: 1, doctorId: 1, createdAt: -1 });

export const DoctorCertificate = mongoose.model("DoctorCertificate", DoctorCertificateSchema);
