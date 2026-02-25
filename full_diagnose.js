// full_diagnose.js — To'liq diagnostika
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;

    // Show all collections and counts
    const collections = await db.listCollections().toArray();
    console.log('=== COLLECTIONS ===');
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} docs`);
    }

    console.log('\n=== ALL DOCTORS ===');
    const doctors = await db.collection('doctors').find({}, {
        projection: { firstName: 1, lastName: 1, userId: 1, commissionRate: 1, percent: 1, commissionEnabled: 1, orgId: 1 }
    }).toArray();
    console.log(JSON.stringify(doctors, null, 2));

    console.log('\n=== ALL PAYMENTS (last 10) ===');
    const payments = await db.collection('payments').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(JSON.stringify(payments.map(p => ({
        _id: p._id,
        amount: p.amount,
        appointmentId: p.appointmentId,
        doctorId: p.doctorId,
        patientId: p.patientId,
        createdAt: p.createdAt
    })), null, 2));

    console.log('\n=== ALL APPOINTMENTS (last 10) ===');
    const apts = await db.collection('appointments').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(JSON.stringify(apts.map(a => ({
        _id: a._id,
        doctorId: a.doctorId,
        patientId: a.patientId,
        status: a.status,
        isPaid: a.isPaid,
        date: a.date,
        price: a.price
    })), null, 2));

    console.log('\n=== COMMISSIONS (all) ===');
    const comms = await db.collection('commissions').find({}).toArray();
    console.log(`Total: ${comms.length}`);
    console.log(JSON.stringify(comms, null, 2));

    console.log('\n=== DIAGNOSIS ===');
    if (payments.length === 0) {
        console.log('❌ TO\'LOV YO\'Q! Qabullar uchun to\'lov amalga oshirilmagan.');
        console.log('   Sabab: Qabul yaratilgan, lekin "To\'lov qilish" / "$" tugmasi bosilmagan.');
        console.log('   YECHIM: Qabullar sahifasida "$" tugmasini bosib to\'lov kiriting.');
    }
    if (doctors.length > 0) {
        const dr = doctors[0];
        const rate = dr.commissionRate || dr.percent || 0;
        if (!dr.userId) {
            console.log('⚠️  Doctor.userId bo\'sh — User akkauntiga bog\'liq emas!');
        }
        if (rate === 0) {
            console.log('⚠️  Doctor komissiya foizi 0% — Maoshlar sahifasida foiz belgilang!');
        } else {
            console.log(`✅ Doctor komissiya foizi: ${rate}%`);
        }
    }

    await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
