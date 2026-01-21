import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';

async function run() {
    console.log('🔧 Admin userga organization biriktirish...\n');

    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB ulandi\n');

    // Admin userni topamiz
    const admin = await User.findOne({ email: 'admin@clinic.uz' });
    if (!admin) {
        console.error('❌ Admin topilmadi!');
        process.exit(1);
    }

    console.log(`📋 Admin topildi: ${admin.name} (${admin.email})`);
    console.log(`   Hozirgi orgId: ${admin.orgId || 'YO\'Q'}\n`);

    // Agar admin'ning orgId'si bo'lsa, davom etamiz
    if (admin.orgId) {
        console.log('✅ Admin allaqachon organizationga biriktirilgan!');
        console.log(`   Organization ID: ${admin.orgId}\n`);
        await mongoose.disconnect();
        return;
    }

    // Organization yaratamiz yoki topamiz
    let org = await Organization.findOne({});

    if (!org) {
        console.log('📝 Organization yaratilmoqda...');
        org = await Organization.create({
            name: 'Test Clinic',
            code: 'TEST001',
            slug: 'test-clinic',
            phone: '+998901234567',
            address: 'Toshkent shahar, Chilonzor tumani',
            isActive: true
        });
        console.log(`   ✅ Organization yaratildi: ${org.name} (${org.code})\n`);
    } else {
        console.log(`✅ Organization topildi: ${org.name} (${org.code})\n`);
    }

    //Admin userga orgId ni qo'shamiz
    admin.orgId = org._id;
    await admin.save();

    console.log('✅ Admin userga organization biriktirildi!');
    console.log(`   User: ${admin.email}`);
    console.log(`   Organization: ${org.name} (${org._id})`);

    // Shifokorlarni ham yangilaymiz
    console.log('\n👨‍⚕️ Shifokorlarni yangilash...');
    const doctors = await User.find({ role: 'doctor', orgId: { $exists: false } });

    for (const doc of doctors) {
        doc.orgId = org._id;
        await doc.save();
        console.log(`   ✅ ${doc.name} -> orgId qo'shildi`);
    }

    console.log(`\n🎉 Tayyor! ${1 + doctors.length} ta user yangilandi!\n`);

    await mongoose.disconnect();
}

run().catch((e) => {
    console.error('❌ Xatolik:', e);
    process.exit(1);
});
