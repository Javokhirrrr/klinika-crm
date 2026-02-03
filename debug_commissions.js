// debug_commissions.js - Sobir doctorning commissionlarini tekshirish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function debugCommissions() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false, collection: 'commissions' }));
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));

        // Find all doctors named Alisher or Sobir
        const doctors = await Doctor.find({
            $or: [
                { firstName: /alisher/i },
                { firstName: /sobir/i }
            ]
        }).lean();

        console.log(`📋 Topilgan shifokorlar: ${doctors.length}\n`);

        for (const doctor of doctors) {
            console.log('─'.repeat(80));
            console.log(`\n👨‍⚕️ Doctor: ${doctor.firstName} ${doctor.lastName}`);
            console.log(`   ID: ${doctor._id}`);
            console.log(`   Commission enabled: ${doctor.commissionEnabled}`);
            console.log(`   Commission rate: ${doctor.commissionRate}%`);
            console.log(`   User ID: ${doctor.userId || 'N/A'}`);

            // Find commissions for this doctor
            const commissions = await Commission.find({
                doctorId: doctor._id
            }).sort({ createdAt: -1 }).limit(10).lean();

            console.log(`\n💰 Commissions (${commissions.length}):`);

            if (commissions.length === 0) {
                console.log('   ❌ Hech qanday commission topilmadi!');

                // Check if there are payments with this doctor's appointments
                const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));
                const Appointment = mongoose.model('Appointment', new mongoose.Schema({}, { strict: false, collection: 'appointments' }));

                const appointments = await Appointment.find({
                    doctorId: doctor._id
                }).limit(5).lean();

                console.log(`\n   📅 Doctor appointments: ${appointments.length}`);

                if (appointments.length > 0) {
                    console.log(`   Appointment IDs: ${appointments.map(a => a._id).join(', ')}`);

                    const payments = await Payment.find({
                        appointmentId: { $in: appointments.map(a => a._id) }
                    }).lean();

                    console.log(`   💳 Payments for these appointments: ${payments.length}`);

                    if (payments.length > 0) {
                        console.log(`   ⚠️  MUAMMO: Payments bor, lekin commission yaratilmagan!`);
                        console.log(`   Sababi: Commission yaratish logikasi ishlamagan`);
                    }
                }
            } else {
                commissions.forEach((c, i) => {
                    console.log(`\n   ${i + 1}. Amount: ${c.amount} so'm (${c.percentage}%)`);
                    console.log(`      Status: ${c.status}`);
                    console.log(`      Payment ID: ${c.paymentId}`);
                    console.log(`      Created: ${new Date(c.createdAt).toLocaleString('uz-UZ')}`);
                    console.log(`      Paid at: ${c.paidAt ? new Date(c.paidAt).toLocaleString('uz-UZ') : 'Not paid'}`);
                });

                const totalPaid = commissions
                    .filter(c => c.status === 'paid')
                    .reduce((sum, c) => sum + c.amount, 0);

                const totalPending = commissions
                    .filter(c => c.status === 'pending')
                    .reduce((sum, c) => sum + c.amount, 0);

                console.log(`\n   📊 Jami:`);
                console.log(`      ✅ Paid: ${totalPaid.toLocaleString()} so'm`);
                console.log(`      ⏳ Pending: ${totalPending.toLocaleString()} so'm`);
            }

            console.log('\n');
        }

        console.log('─'.repeat(80));

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugCommissions();
