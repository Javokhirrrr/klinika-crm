// make_admin.js — foydalanuvchini admin qilish
// Ishlatish: node make_admin.js
// Yoki boshqa MONGO_URI bilan: MONGO_URI="..." node make_admin.js

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TARGET_EMAIL = 'jubaydullayev765@gmail.com';
const TARGET_PASSWORD = 'Admin2025!'; // register bo'lmagan bo'lsa shu parol bilan yaratiladi

async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI env variable yoq!');
        process.exit(1);
    }
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // Collections ni ko'rish
    const cols = await db.listCollections().toArray();
    console.log('📦 Collections:', cols.map(c => c.name).join(', ') || '(bo\'sh)');

    // Foydalanuvchini qidirish
    let user = await db.collection('users').findOne({ email: TARGET_EMAIL });

    if (!user) {
        console.log(`⚠️  Foydalanuvchi topilmadi: ${TARGET_EMAIL}`);
        console.log('➕ Yangi admin foydalanuvchi yaratilmoqda...');

        // Org yaratish (agar kerak bo'lsa)
        let orgId;
        const existOrg = await db.collection('organizations').findOne({ name: "Admin Panel" });
        if (existOrg) {
            orgId = existOrg._id;
        } else {
            const orgResult = await db.collection('organizations').insertOne({
                name: 'Admin Panel',
                code: '000001',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            orgId = orgResult.insertedId;
        }

        const passwordHash = await bcrypt.hash(TARGET_PASSWORD, 10);
        const result = await db.collection('users').insertOne({
            name: 'Javohir Admin',
            email: TARGET_EMAIL,
            role: 'admin',
            globalRole: 'platform_admin',
            orgId,
            passwordHash,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('\n✅ Yangi admin yaratildi!');
        console.log('  Email:', TARGET_EMAIL);
        console.log('  Parol:', TARGET_PASSWORD);
        console.log('  Role: admin');
        console.log('  GlobalRole: platform_admin');
    } else {
        console.log('📋 Hozirgi holat:');
        console.log('  name:', user.name);
        console.log('  email:', user.email);
        console.log('  role:', user.role);
        console.log('  globalRole:', user.globalRole);

        // Rolni yangilash
        await db.collection('users').updateOne(
            { email: TARGET_EMAIL },
            {
                $set: {
                    role: 'admin',
                    globalRole: 'platform_admin',
                    isActive: true,
                    isDeleted: false,
                    updatedAt: new Date(),
                }
            }
        );

        const updated = await db.collection('users').findOne({ email: TARGET_EMAIL });
        console.log('\n✅ Yangilandi:');
        console.log('  role:', updated.role);
        console.log('  globalRole:', updated.globalRole);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Tayyor!');
}

main().catch(console.error);
