// fix_duplicate_email.js - Duplicate email muammosini tuzatish
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function fixDuplicateEmails() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

        // Find all users with duplicate emails (including deleted ones)
        const duplicateEmail = 'navrozbekubaydullayev7@gmail.com';

        const users = await User.find({
            email: duplicateEmail,
        }).lean();

        console.log(`\nFound ${users.length} users with email: ${duplicateEmail}\n`);

        for (const user of users) {
            console.log(`User ID: ${user._id}`);
            console.log(`  - Name: ${user.name}`);
            console.log(`  - Email: ${user.email}`);
            console.log(`  - isDeleted: ${user.isDeleted}`);
            console.log(`  - isActive: ${user.isActive}`);
            console.log(`  - createdAt: ${user.createdAt}`);
            console.log('');
        }

        // Find deleted or inactive users
        const deletedUsers = users.filter(u => u.isDeleted === true || u.isActive === false);

        if (deletedUsers.length > 0) {
            console.log(`\n🔧 Fixing ${deletedUsers.length} deleted/inactive user(s)...\n`);

            for (const user of deletedUsers) {
                const timestamp = Date.now();
                const newEmail = `${user.email}.deleted.${timestamp}`;

                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            email: newEmail,
                            isDeleted: true,
                            isActive: false
                        }
                    }
                );

                console.log(`✅ Updated user ${user._id}:`);
                console.log(`   Old email: ${user.email}`);
                console.log(`   New email: ${newEmail}\n`);
            }

            console.log('✅ All duplicate emails fixed!');
        } else {
            console.log('⚠️ No deleted/inactive users found. You may have an active duplicate.');
            console.log('Please manually delete or rename one of the users.');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixDuplicateEmails();
