// fix_doctor_commission.js - Doctor commission sozlamalarini tuzatish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function fixDoctorCommission() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));

        // Find doctor by name
        const doctorName = process.argv[2] || 'Alisher';
        const commissionRate = Number(process.argv[3]) || 30;

        const doctor = await Doctor.findOne({
            firstName: new RegExp(doctorName, 'i')
        });

        if (!doctor) {
            console.log(`❌ Doctor "${doctorName}" topilmadi!`);
            await mongoose.disconnect();
            return;
        }

        console.log(`📋 Hozirgi sozlamalar:`);
        console.log(`   Doctor: ${doctor.firstName} ${doctor.lastName}`);
        console.log(`   ID: ${doctor._id}`);
        console.log(`   Commission enabled: ${doctor.commissionEnabled}`);
        console.log(`   Commission rate: ${doctor.commissionRate}%\n`);

        // Update commission settings
        const updated = await Doctor.findByIdAndUpdate(
            doctor._id,
            {
                $set: {
                    commissionEnabled: true,
                    commissionRate: commissionRate
                }
            },
            { new: true }
        );

        console.log(`✅ Yangilandi:\n`);
        console.log(`   Commission enabled: ${updated.commissionEnabled}`);
        console.log(`   Commission rate: ${updated.commissionRate}%\n`);

        console.log(`🎉 Tayyor! Endi yangi to'lovlar uchun commission yaratiladi.`);
        console.log(`⚠️  MUHIM: Eski to'lovlar uchun commission avtomatik yaratilmaydi!`);

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixDoctorCommission();
