// src/models/Counter.js
import { Schema, model } from 'mongoose';

const counterSchema = new Schema(
  {
    _id: { type: String, required: true }, // masalan: 'org_code'
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = model('Counter', counterSchema);
