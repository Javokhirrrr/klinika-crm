// fix_alisher_commission.js - Fix Alisher commission for correct org
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function fixAlisherCommission() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));

        // Target doctor ID from debug output
        const doctorId = '697605e2879955b9dbd8d522';

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            console.log('❌ Doctor not found!');
            await mongoose.disconnect();
            return;
        }

        console.log(`📋 Current settings:`);
        console.log(`   Doctor: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   ID: ${doctor._id}`);
        console.log(`   Commission enabled: ${doctor.commissionEnabled}`);
        console.log(`   Commission rate: ${doctor.commissionRate || doctor.percent || 0}%\n`);

        // Update
        doctor.commissionEnabled = true;
        doctor.commissionRate = 30;
        await doctor.save();

        console.log(`✅ Updated:\n`);
        console.log(`   Commission enabled: ${doctor.commissionEnabled}`);
        console.log(`   Commission rate: ${doctor.commissionRate}%\n`);

        console.log(`🎉 Tayyor! Endi yangi to'lovlar uchun commission yaratiladi.`);

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAlisherCommission();
