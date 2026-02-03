// create_commissions_all_payments.js - Create commissions for ALL Alisher payments
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function createCommissionsAllPayments() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false, collection: 'commissions' }));

        // Target doctor
        const doctorId = '697605e2879955b9dbd8d522';
        const orgId = '6975f68fae4c9675cb25aa68';

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            console.log('❌ Doctor not found!');
            await mongoose.disconnect();
            return;
        }

        console.log(`👨‍⚕️ Doctor: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   Commission rate: ${doctor.commissionRate || 30}%\n`);

        const commissionRate = doctor.commissionRate || 30;

        // Get ALL payments from the org (we'll manually assign to Alisher)
        const allPayments = await Payment.find({
            orgId: new mongoose.Types.ObjectId(orgId),
            status: 'completed'
        }).lean();

        console.log(`💳 Total payments: ${allPayments.length}\n`);

        if (allPayments.length === 0) {
            console.log('❌ No payments found!');
            await mongoose.disconnect();
            return;
        }

        // Ask user to confirm
        console.log('⚠️  WARNING: This will create commissions for ALL payments!');
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        let created = 0;
        let skipped = 0;
        let totalAmount = 0;

        for (const payment of allPayments) {
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
                appointmentId: payment.appointmentId || null,
                patientId: payment.patientId,
                amount: commissionAmount,
                percentage: commissionRate,
                baseAmount: payment.amount,
                status: 'pending',
                createdAt: payment.createdAt
            });

            created++;
            totalAmount += commissionAmount;

            if (created <= 10) {
                console.log(`✅ ${created}. Commission: ${commissionAmount.toLocaleString()} so'm (payment: ${payment.amount.toLocaleString()})`);
            } else if (created % 10 === 0) {
                console.log(`   ... ${created} commissions created ...`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped (exists): ${skipped}`);
        console.log(`   💰 Total commission: ${totalAmount.toLocaleString()} so'm`);
        console.log(`\n🎉 Commissions yaratildi! Endi salary page'ni yangilang.`);

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createCommissionsAllPayments();
