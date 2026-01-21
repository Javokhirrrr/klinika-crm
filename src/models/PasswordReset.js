// src/models/PasswordReset.js
import { Schema, model } from 'mongoose';

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },  // Index created by TTL below
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index: expiresAt vaqti o‘tishi bilan hujjat o‘chsin
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = model('PasswordReset', passwordResetSchema);
