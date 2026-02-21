import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Connecting to:', process.env.MONGO_URI?.substring(0, 50) + '...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== Collections in DB ===');
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} documents`);
    }

    // Check users collection directly
    const allUsers = await db.collection('users').find({}).limit(20).toArray();
    console.log('\n=== ALL USERS (no filter) ===');
    console.log('Count:', allUsers.length);
    allUsers.forEach(u => {
        console.log({ name: u.name, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, isDeleted: u.isDeleted });
    });

    await mongoose.disconnect();
}

main().catch(console.error);
