// fix_user_role.js - User rolini o'zgartirish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function fixUserRole() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // Eng yangi active user (NAVRO'ZBEK VOHID O'G'LI UBAYDULLAYEV)
        const userId = '6975f35dc53ee549fc5affc6';
        const newRole = 'owner'; // yoki 'admin', 'doctor', etc.

        const user = await User.findById(userId).lean();

        if (!user) {
            console.log('❌ User topilmadi!');
            await mongoose.disconnect();
            return;
        }

        console.log('📋 Hozirgi user ma\'lumotlari:');
        console.log(`   Ism: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Hozirgi role: ${user.role}`);
        console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}\n`);

        console.log(`🔧 Roleni o'zgartirish: ${user.role} → ${newRole}\n`);

        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    role: newRole,
                    isActive: true,
                    isDeleted: false
                }
            },
            { new: true }
        ).lean();

        if (updated) {
            console.log('✅ User muvaffaqiyatli yangilandi!\n');
            console.log(`📧 Email: ${updated.email}`);
            console.log(`👤 Ism: ${updated.name}`);
            console.log(`🔐 Yangi role: ${updated.role}`);
            console.log(`✅ Status: ${updated.isActive ? 'Active' : 'Inactive'}`);
            console.log('\n🎉 Endi siz DIREKTOR (owner) sifatida login qilishingiz mumkin!');
        } else {
            console.log('❌ Yangilashda xatolik yuz berdi');
        }

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixUserRole();
