// restore_director.js - Direktor user'ni qayta tiklash
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function restoreDirector() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // Email to search for
        const searchEmail = 'navrozbekubaydullayev7@gmail.com';

        // Find deleted users with this email (including .deleted.timestamp versions)
        const deletedUsers = await User.find({
            $or: [
                { email: searchEmail, isDeleted: true },
                { email: { $regex: `^${searchEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.deleted\\.` } }
            ]
        }).sort({ createdAt: -1 }).lean();

        if (deletedUsers.length === 0) {
            console.log('❌ O\'chirilgan direktor topilmadi');
            await mongoose.disconnect();
            return;
        }

        console.log(`📋 Topilgan o'chirilgan userlar (${deletedUsers.length}):\n`);
        deletedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user._id}`);
            console.log(`   Ism: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   O'chirilgan: ${new Date(user.updatedAt || user.createdAt).toLocaleString('uz-UZ')}`);
            console.log('');
        });

        // Select the most recent director
        const director = deletedUsers.find(u => u.role === 'owner' || u.role === 'director') || deletedUsers[0];

        console.log(`🔧 Tiklanayotgan user: ${director.name} (${director._id})\n`);

        // Restore original email
        let restoredEmail = director.email;
        if (director.email.includes('.deleted.')) {
            restoredEmail = director.email.split('.deleted.')[0];
        }

        // Check if the original email is already taken
        const emailExists = await User.findOne({
            email: restoredEmail,
            isDeleted: { $ne: true },
            _id: { $ne: director._id }
        }).lean();

        if (emailExists) {
            console.log(`⚠️  Email ${restoredEmail} allaqachon ishlatilmoqda!`);
            console.log(`   Mavjud user: ${emailExists.name} (${emailExists._id})`);
            console.log('\n❌ Tiklash mumkin emas. Avval mavjud userni o\'chiring yoki boshqa email ishlating.\n');
            await mongoose.disconnect();
            return;
        }

        // Restore the user
        const restored = await User.findByIdAndUpdate(
            director._id,
            {
                $set: {
                    isDeleted: false,
                    isActive: true,
                    email: restoredEmail
                }
            },
            { new: true }
        ).lean();

        if (restored) {
            console.log('✅ User muvaffaqiyatli tiklandi!\n');
            console.log(`📧 Email: ${restored.email}`);
            console.log(`👤 Ism: ${restored.name}`);
            console.log(`🔐 Role: ${restored.role}`);
            console.log(`✅ Status: Active`);
            console.log('\n🎉 Endi login qilishingiz mumkin!');
        } else {
            console.log('❌ Tiklashda xatolik yuz berdi');
        }

        await mongoose.disconnect();
        console.log('\n✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

restoreDirector();
