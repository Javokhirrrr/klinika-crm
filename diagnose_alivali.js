// diagnose_alivali.js — Ali Vali shifokorning komissiyasini to'liq tekshirish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function diagnose() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB ulanish muvaffaqiyatli\n');

    const loose = (name, coll) => mongoose.model(name, new mongoose.Schema({}, { strict: false, collection: coll }));

    const User = loose('User2', 'users');
    const Doctor = loose('Doctor2', 'doctors');
    const Appointment = loose('Appointment2', 'appointments');
    const Payment = loose('Payment2', 'payments');
    const Commission = loose('Commission2', 'commissions');

    // ── 1. Ali Vali user ───────────────────────────────────────────────────────
    console.log('═'.repeat(70));
    console.log('1. USER (Ali Vali)');
    console.log('═'.repeat(70));
    const user = await User.findOne({ name: /ali vali/i }).lean();
    if (!user) { console.log('❌ Ali Vali user topilmadi!'); process.exit(1); }
    console.log(`   ID: ${user._id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   baseSalary: ${user.baseSalary || 0}`);
    console.log(`   commissionRate (User): ${user.commissionRate || 0}%`);
    console.log(`   commissionEnabled (User): ${user.commissionEnabled}`);

    // ── 2. Doctor record ───────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('2. DOCTOR RECORD');
    console.log('═'.repeat(70));
    let doctor = await Doctor.findOne({ userId: user._id }).lean();
    if (!doctor) doctor = await Doctor.findOne({ firstName: /ali/i }).lean();
    if (doctor) {
        console.log(`   ✅ Doctor topildi: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   Doctor._id: ${doctor._id}`);
        console.log(`   userId: ${doctor.userId || 'BOʻSH ❌'}`);
        console.log(`   percent (eski): ${doctor.percent || 0}%`);
        console.log(`   commissionRate: ${doctor.commissionRate || 0}%`);
        console.log(`   commissionEnabled: ${doctor.commissionEnabled}`);
        if (!doctor.userId) {
            console.log('\n   ⚠️  MUAMMO: Doctor.userId boʻsh! User va Doctor bogʻlanmagan.');
            console.log('   YECHIM: Doctor.userId = user._id ga oʻrnatish kerak.');
        }
    } else {
        console.log('   ❌ Doctor record topilmadi!');
    }

    // ── 3. Appointments ────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('3. QABULLAR (Appointments)');
    console.log('═'.repeat(70));
    const docId = doctor?._id;
    const apts = docId
        ? await Appointment.find({ doctorId: docId }).sort({ createdAt: -1 }).limit(10).lean()
        : [];
    console.log(`   Jami ${apts.length} ta qabul topildi`);
    apts.forEach((a, i) => {
        console.log(`\n   ${i + 1}. ID: ${a._id}`);
        console.log(`      Status: ${a.status}`);
        console.log(`      isPaid: ${a.isPaid}`);
        console.log(`      Patient: ${a.patientId}`);
        console.log(`      Date: ${a.date || a.startAt}`);
    });

    // ── 4. Payments ────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('4. TOʻLOVLAR (Payments)');
    console.log('═'.repeat(70));
    const aptIds = apts.map(a => a._id);
    const payments = aptIds.length
        ? await Payment.find({ appointmentId: { $in: aptIds } }).lean()
        : [];
    console.log(`   Qabullarga bogʻliq toʻlovlar: ${payments.length}`);
    if (payments.length === 0) {
        console.log('   ⚠️  TOʻLOV YOʻQ — Komissiya yaratilmagan sababi bu!');
        console.log('   Qabullar "Rejalashtrilgan" holatida, toʻlov amalga oshirilmagan.');
        // Also check payments by patientId
        const patIds = [...new Set(apts.map(a => String(a.patientId)))];
        const allPays = await Payment.find({ patientId: { $in: patIds } }).sort({ createdAt: -1 }).lean();
        console.log(`\n   Bemorlar uchun jami toʻlovlar (appointmentId qatʼiy emas): ${allPays.length}`);
        allPays.slice(0, 5).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.amount} soʻm | appointmentId: ${p.appointmentId || 'YOʻQ'} | doctorId: ${p.doctorId || 'YOʻQ'}`);
        });
    } else {
        payments.forEach((p, i) => {
            console.log(`\n   ${i + 1}. Amount: ${p.amount} soʻm`);
            console.log(`      appointmentId: ${p.appointmentId}`);
            console.log(`      doctorId in payment: ${p.doctorId || 'YOʻQ'}`);
        });
    }

    // ── 5. Commissions ─────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('5. KOMISSIYALAR (Commissions)');
    console.log('═'.repeat(70));
    const comms = docId
        ? await Commission.find({
            $or: [{ doctorId: docId }, { userId: user._id }]
        }).sort({ createdAt: -1 }).lean()
        : [];
    console.log(`   Jami komissiya: ${comms.length}`);
    comms.slice(0, 10).forEach((c, i) => {
        console.log(`\n   ${i + 1}. ${c.amount} soʻm (${c.percentage}%) | Status: ${c.status}`);
        console.log(`      doctorId: ${c.doctorId} | userId: ${c.userId}`);
        console.log(`      Sana: ${new Date(c.createdAt).toLocaleDateString('uz-UZ')}`);
    });
    if (comms.length === 0) {
        console.log('   ❌ Hech qanday komissiya recordi topilmadi!');
    }

    // ── 6. Diagnosis summary ───────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(70));
    console.log('6. XULOSA');
    console.log('═'.repeat(70));
    if (!doctor?.userId) {
        console.log('🔴 ASOSIY MUAMMO: Doctor.userId = null (User bilan bogʻlanmagan)');
        console.log(`   YECHIM: node fix_doctor_link.js ${user._id} ${docId}`);
    } else if ((doctor?.commissionRate || doctor?.percent || 0) === 0) {
        console.log('🔴 MUAMMO: Doctor komissiya foizi 0%');
        console.log('   YECHIM: Maoshlar sahifasida foiz belgilang');
    } else if (payments.length === 0) {
        console.log('🟡 MUAMMO: Qabullar uchun toʻlov amalga oshirilmagan');
        console.log('   YECHIM: Qabul tugagandan soʻng toʻlov qiling — komissiya avtomatik yaratiladi');
    } else if (comms.length === 0) {
        console.log('🔴 MUAMMO: Toʻlovlar bor lekin komissiya yaratilmagan');
        console.log('   Sababi: Toʻlov yaratilganda doktorId yoʻq edi yoki foiz 0 edi');
    } else {
        console.log('✅ Hamma narsa toʻgʻri boʻlib koʻrinadi');
    }

    await mongoose.disconnect();
    console.log('\n✅ Diagnoz yakunlandi');
}

diagnose().catch(e => { console.error('❌', e); process.exit(1); });
