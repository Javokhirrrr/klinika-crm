// src/utils/orgCode.js
import { Counter } from '../models/Counter.js';

const BASE = Number(process.env.ORG_CODE_BASE ?? 150000);

/**
 * Keyingi unikal tashkilot kodini qaytaradi (string).
 * 1-chi yaratilganda: 150001, keyingi: 150002, ...
 * Operatsiya atomar: findOneAndUpdate + $inc
 */
export async function nextOrgCode() {
  const doc = await Counter.findOneAndUpdate(
    { _id: 'org_code' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  const numeric = BASE + (doc?.seq ?? 0);
  return String(numeric);
}

/** Orqaga moslik uchun eski nomni ham eksport qilib qo‘yamiz */
export const makeOrgCode = nextOrgCode;
