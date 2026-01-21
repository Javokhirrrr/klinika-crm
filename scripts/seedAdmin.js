// ESM: package.json ichida "type": "module" bo'lgani uchun import ishlatamiz
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

async function run() {
  // DB ga ulanamiz
  await mongoose.connect(env.mongoUri);

  // Parametrlar (ixtiyoriy): node scripts/seedAdmin.js email parol ism
  const email = (process.argv[2] || 'admin@clinic.uz').toLowerCase();
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin';

  // Bor-yo'qligini tekshiramiz (soft-delete bo'lmagan)
  const existing = await User.findOne({ email, isDeleted: { $ne: true } }).lean();
  if (existing) {
    console.log('✅ Admin allaqachon mavjud:', email);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  await User.create({
    name,
    email,
    role: 'admin',
    passwordHash,
    isActive: true,
    isDeleted: false,
  });

  console.log('✅ Admin yaratildi:', email, 'parol:', password);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Seed xatosi:', e);
  process.exit(1);
});
