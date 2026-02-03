// list_all_users.js - Barcha userlarni ko'rish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function listAllUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // Find all users (including deleted)
        const allUsers = await User.find({}).sort({ createdAt: -1 }).lean();

        console.log(`📋 Jami ${allUsers.length} ta user topildi:\n`);
        console.log('='.repeat(100) + '\n');

        allUsers.forEach((user, index) => {
            const status = user.isDeleted ? '🗑️  O\'CHIRILGAN' : (user.isActive ? '✅ ACTIVE' : '❌ INACTIVE');
            console.log(`${index + 1}. [${status}] ${user.name}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${new Date(user.createdAt).toLocaleString('uz-UZ')}`);
            if (user.isDeleted) {
                console.log(`   Deleted: ${new Date(user.updatedAt || user.createdAt).toLocaleString('uz-UZ')}`);
            }
            console.log('');
        });

        console.log('='.repeat(100) + '\n');

        // Summary
        const active = allUsers.filter(u => !u.isDeleted && u.isActive).length;
        const deleted = allUsers.filter(u => u.isDeleted).length;
        const inactive = allUsers.filter(u => !u.isDeleted && !u.isActive).length;

        console.log('📊 STATISTIKA:');
        console.log(`   ✅ Active: ${active}`);
        console.log(`   ❌ Inactive: ${inactive}`);
        console.log(`   🗑️  Deleted: ${deleted}`);
        console.log(`   📦 Jami: ${allUsers.length}\n`);

        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllUsers();
