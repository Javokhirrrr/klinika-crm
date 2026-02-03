// check_alisher_data.js - Check all Alisher's data
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function checkAlisherData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));
        const Appointment = mongoose.model('Appointment', new mongoose.Schema({}, { strict: false, collection: 'appointments' }));
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false, collection: 'commissions' }));

        // Find Alisher
        const doctor = await Doctor.findOne({ firstName: /alisher/i });

        if (!doctor) {
            console.log('❌ Alisher Doctor not found!');
            await mongoose.disconnect();
            return;
        }

        console.log('👨‍⚕️ Doctor Info:');
        console.log(`   Name: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   ID: ${doctor._id}`);
        console.log(`   Commission: ${doctor.commissionRate}% (enabled: ${doctor.commissionEnabled})`);
        console.log();

        // Check appointments
        const appointments = await Appointment.find({ doctorId: doctor._id }).limit(5).lean();
        console.log(`📅 Appointments: ${appointments.length}`);
        if (appointments.length > 0) {
            appointments.forEach((a, i) => {
                console.log(`   ${i + 1}. ID: ${a._id}, Date: ${a.date}, Patient: ${a.patientId}`);
            });
        }
        console.log();

        // Check payments with appointments
        const appointmentIds = appointments.map(a => a._id);
        const paymentsWithAppt = await Payment.find({
            appointmentId: { $in: appointmentIds }
        }).lean();

        console.log(`💳 Payments (with appointments): ${paymentsWithAppt.length}`);
        if (paymentsWithAppt.length > 0) {
            const total = paymentsWithAppt.reduce((sum, p) => sum + p.amount, 0);
            console.log(`   Total: ${total.toLocaleString()} so'm`);
        }
        console.log();

        // Check ALL payments (maybe without appointments?)
        const allPayments = await Payment.find({}).limit(10).lean();
        console.log(`💵 Sample payments (first 10):`);
        allPayments.forEach((p, i) => {
            console.log(`   ${i + 1}. Amount: ${p.amount}, Appointment: ${p.appointmentId || 'N/A'}, Patient: ${p.patientId}`);
        });
        console.log();

        // Check commissions
        const commissions = await Commission.find({ doctorId: doctor._id }).lean();
        console.log(`🎁 Commissions: ${commissions.length}`);
        if (commissions.length > 0) {
            const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
            const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
            console.log(`   Pending: ${totalPending.toLocaleString()} so'm`);
            console.log(`   Paid: ${totalPaid.toLocaleString()} so'm`);
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAlisherData();
