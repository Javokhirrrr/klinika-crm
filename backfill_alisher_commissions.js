// backfill_alisher_commissions.js - Create commissions for existing payments
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

        // Target doctor
        const doctorId = '697605e2879955b9dbd8d522';
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            console.log('❌ Doctor not found!');
            await mongoose.disconnect();
            return;
        }

        console.log(`👨‍⚕️ Doctor: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   Commission rate: ${doctor.commissionRate || doctor.percent || 0}%\n`);

        const commissionRate = doctor.commissionRate || doctor.percent || 0;

        if (commissionRate <= 0) {
            console.log('❌ Commission rate is 0!');
            await mongoose.disconnect();
            return;
        }

        // Find all appointments for this doctor
        const appointments = await Appointment.find({
            orgId: doctor.orgId,
            doctorId: doctor._id
        }).lean();

        console.log(`📅 Appointments: ${appointments.length}\n`);

        if (appointments.length === 0) {
            console.log('ℹ️ No appointments found. Checking for direct payments...\n');

            // Maybe payments don't have appointments?
            // Let's just create test commission manually
            const samplePayments = await Payment.find({
                orgId: doctor.orgId
            }).limit(5).lean();

            console.log(`💳 Sample payments found: ${samplePayments.length}`);

            if (samplePayments.length > 0) {
                console.log('\n⚠️ Payments exist but no appointments linked!');
                console.log('Solution: Update payments to include doctorId or create appointments.\n');
            }

            await mongoose.disconnect();
            return;
        }

        const appointmentIds = appointments.map(a => a._id);

        // Find payments with these appointments
        const payments = await Payment.find({
            appointmentId: { $in: appointmentIds },
            status: 'completed'
        }).lean();

        console.log(`💳 Payments: ${payments.length}\n`);

        if (payments.length === 0) {
            console.log('ℹ️ No payments found for these appointments.');
            await mongoose.disconnect();
            return;
        }

        let created = 0;
        let skipped = 0;
        let totalAmount = 0;

        for (const payment of payments) {
            // Check if commission already exists
            const existing = await Commission.findOne({
                paymentId: payment._id
            });

            if (existing) {
                skipped++;
                continue;
            }

            const commissionAmount = (payment.amount * commissionRate) / 100;

            await Commission.create({
                orgId: payment.orgId,
                userId: doctor.userId || doctor._id,
                doctorId: doctor._id,
                paymentId: payment._id,
                appointmentId: payment.appointmentId,
                patientId: payment.patientId,
                amount: commissionAmount,
                percentage: commissionRate,
                baseAmount: payment.amount,
                status: 'pending',
                createdAt: payment.createdAt // Use payment date
            });

            created++;
            totalAmount += commissionAmount;

            console.log(`✅ ${created}. Commission: ${commissionAmount.toLocaleString()} so'm (payment: ${payment.amount.toLocaleString()})`);
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped (exists): ${skipped}`);
        console.log(`   💰 Total commission: ${totalAmount.toLocaleString()} so'm\n`);

        await mongoose.disconnect();
        console.log('✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

backfillCommissions();
