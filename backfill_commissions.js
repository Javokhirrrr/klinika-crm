// backfill_commissions.js - Eski to'lovlar uchun commission yaratish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function backfillCommissions() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));
        const Appointment = mongoose.model('Appointment', new mongoose.Schema({}, { strict: false, collection: 'appointments' }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false, collection: 'commissions' }));

        // Find doctor
        const doctorName = process.argv[2] || 'Alisher';
        const doctor = await Doctor.findOne({
            firstName: new RegExp(doctorName, 'i')
        });

        if (!doctor) {
            console.log(`❌ Doctor "${doctorName}" topilmadi!`);
            await mongoose.disconnect();
            return;
        }

        if (!doctor.commissionEnabled || doctor.commissionRate <= 0) {
            console.log(`❌ Doctor commission sozlamasi o'chirilgan!`);
            await mongoose.disconnect();
            return;
        }

        console.log(`👨‍⚕️ Doctor: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   Commission rate: ${doctor.commissionRate}%\n`);

        // Find all appointments for this doctor
        const appointments = await Appointment.find({
            doctorId: doctor._id
        }).lean();

        console.log(`📅 Jami appointments: ${appointments.length}`);

        if (appointments.length === 0) {
            console.log('   Appointments topilmadi!');
            await mongoose.disconnect();
            return;
        }

        const appointmentIds = appointments.map(a => a._id);

        // Find payments with these appointments
        const payments = await Payment.find({
            appointmentId: { $in: appointmentIds },
            status: 'completed'
        }).lean();

        console.log(`💳 Jami to'lovlar: ${payments.length}\n`);

        if (payments.length === 0) {
            console.log('   To\'lovlar topilmadi!');
            await mongoose.disconnect();
            return;
        }

        let created = 0;
        let skipped = 0;
        let totalAmount = 0;

        for (const payment of payments) {
            // Check if commission already exists
            const existingCommission = await Commission.findOne({
                paymentId: payment._id
            });

            if (existingCommission) {
                skipped++;
                continue;
            }

            const commissionAmount = (payment.amount * doctor.commissionRate) / 100;

            await Commission.create({
                orgId: payment.orgId,
                userId: doctor.userId || doctor._id,
                doctorId: doctor._id,
                paymentId: payment._id,
                appointmentId: payment.appointmentId,
                patientId: payment.patientId,
                amount: commissionAmount,
                percentage: doctor.commissionRate,
                baseAmount: payment.amount,
                status: 'pending' // Default to pending
            });

            created++;
            totalAmount += commissionAmount;

            console.log(`✅ Commission yaratildi: ${commissionAmount.toLocaleString()} so'm (to'lov: ${payment.amount.toLocaleString()})`);
        }

        console.log(`\n📊 Natija:`);
        console.log(`   ✅ Yaratildi: ${created}`);
        console.log(`   ⏭️  O'tkazildi (mavjud): ${skipped}`);
        console.log(`   💰 Jami commission: ${totalAmount.toLocaleString()} so'm`);
        console.log(`\n⚠️  MUHIM: Commissionlar 'pending' status bilan yaratildi.`);
        console.log(`   To'lovni tasdiqlash uchun /commissions sahifasida 'Approve' bosing.`);

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

backfillCommissions();
