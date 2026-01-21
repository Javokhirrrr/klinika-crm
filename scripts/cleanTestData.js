import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Service } from '../src/models/Service.js';
import { Patient } from '../src/models/Patient.js';
import { Appointment } from '../src/models/Appointment.js';
import { Payment } from '../src/models/Payment.js';
import { Attendance } from '../src/models/Attendance.js';
import { Commission } from '../src/models/Commission.js';
import { QueueEntry } from '../src/models/QueueEntry.js';

async function run() {
    console.log('🗑️  Barcha test ma\'lumotlarni o\'chirish...\n');

    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB ulandi\n');

    const results = await Promise.all([
        Service.deleteMany({}),
        Patient.deleteMany({}),
        Appointment.deleteMany({}),
        Payment.deleteMany({}),
        Attendance.deleteMany({}),
        Commission.deleteMany({}),
        QueueEntry.deleteMany({})
    ]);

    console.log('📊 O\'chirilgan ma\'lumotlar:');
    console.log(`   Xizmatlar: ${results[0].deletedCount}`);
    console.log(`   Беmorlar: ${results[1].deletedCount}`);
    console.log(`   Uchrashuvlar: ${results[2].deletedCount}`);
    console.log(`   To'lovlar: ${results[3].deletedCount}`);
    console.log(`   Davomat: ${results[4].deletedCount}`);
    console.log(`   Komissiyalar: ${results[5].deletedCount}`);
    console.log(`   Navbat: ${results[6].deletedCount}`);

    console.log('\n✅ Barcha test ma\'lumotlar tozalandi!\n');

    await mongoose.disconnect();
}

run().catch((e) => {
    console.error('❌ Xatolik:', e);
    process.exit(1);
});
