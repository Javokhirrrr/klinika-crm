// debug_salary_full.js - To'liq salary debug
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function debugSalaryFull() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false, collection: 'doctors' }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false, collection: 'commissions' }));

        // Get organization ID from command line or use default
        const orgId = process.argv[2];
        if (!orgId) {
            console.log('❌ Usage: node debug_salary_full.js <orgId>');
            await mongoose.disconnect();
            return;
        }

        console.log(`🏢 Organization ID: ${orgId}\n`);
        console.log('='.repeat(80));

        // 1. Check all users
        const users = await User.find({
            orgId: new mongoose.Types.ObjectId(orgId),
            isDeleted: { $ne: true },
            isActive: true
        }).lean();

        console.log(`\n👥 USERS (${users.length}):\n`);

        for (const user of users) {
            console.log(`\n📝 ${user.name} (${user.role})`);
            console.log(`   User ID: ${user._id}`);
            console.log(`   Base Salary: ${(user.baseSalary || 0).toLocaleString()} so'm`);
            console.log(`   KPI Bonus: ${(user.kpiBonus || 0).toLocaleString()} so'm`);

            // Try to find doctor
            let doctor = await Doctor.findOne({
                orgId: new mongoose.Types.ObjectId(orgId),
                userId: user._id,
                isDeleted: { $ne: true }
            }).lean();

            if (!doctor && user.role === 'doctor') {
                const nameParts = (user.name || '').split(' ');
                if (nameParts.length > 0) {
                    doctor = await Doctor.findOne({
                        orgId: new mongoose.Types.ObjectId(orgId),
                        firstName: new RegExp(nameParts[0], 'i'),
                        isDeleted: { $ne: true }
                    }).lean();
                }
            }

            if (doctor) {
                console.log(`   ✅ Doctor found: ${doctor.firstName} ${doctor.lastName}`);
                console.log(`      Doctor ID: ${doctor._id}`);
                console.log(`      Commission Rate: ${doctor.commissionRate || doctor.percent || 0}%`);
                console.log(`      Commission Enabled: ${doctor.commissionEnabled !== false}`);

                // Get current month
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

                // Find commissions
                const commissions = await Commission.find({
                    orgId: new mongoose.Types.ObjectId(orgId),
                    doctorId: doctor._id,
                    createdAt: { $gte: firstDay, $lte: lastDay }
                }).lean();

                console.log(`      💰 Commissions this month: ${commissions.length}`);

                if (commissions.length > 0) {
                    let totalPending = 0;
                    let totalPaid = 0;

                    commissions.forEach((c, i) => {
                        console.log(`         ${i + 1}. ${c.amount.toLocaleString()} so'm (${c.status}) - Created: ${new Date(c.createdAt).toLocaleDateString()}`);
                        if (c.status === 'paid') totalPaid += c.amount;
                        else if (c.status === 'pending' || c.status === 'approved') totalPending += c.amount;
                    });

                    console.log(`      📊 Total Pending: ${totalPending.toLocaleString()} so'm`);
                    console.log(`      📊 Total Paid: ${totalPaid.toLocaleString()} so'm`);
                    console.log(`      📊 GRAND TOTAL: ${(totalPending + totalPaid).toLocaleString()} so'm`);
                } else {
                    console.log(`      ⚠️ NO commissions found for this month!`);

                    // Check if there are ANY commissions ever
                    const anyCommissions = await Commission.find({
                        orgId: new mongoose.Types.ObjectId(orgId),
                        doctorId: doctor._id
                    }).sort({ createdAt: -1 }).limit(3).lean();

                    if (anyCommissions.length > 0) {
                        console.log(`      ℹ️ But found ${anyCommissions.length} commissions in other months:`);
                        anyCommissions.forEach((c, i) => {
                            console.log(`         ${i + 1}. ${c.amount.toLocaleString()} so'm - ${new Date(c.createdAt).toLocaleDateString()}`);
                        });
                    } else {
                        console.log(`      ❌ NO commissions found EVER for this doctor!`);
                    }
                }
            } else {
                console.log(`   ❌ No doctor found for this user`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n🔍 DIAGNOSIS:\n');

        // Check total commissions
        const totalCommissions = await Commission.countDocuments({
            orgId: new mongoose.Types.ObjectId(orgId)
        });

        console.log(`📊 Total commissions in database: ${totalCommissions}`);

        if (totalCommissions === 0) {
            console.log('❌ NO COMMISSIONS IN DATABASE!');
            console.log('   Reason: Payments are being created but commissions are NOT being generated.');
            console.log('   Check:');
            console.log('   1. Payment creation console logs');
            console.log('   2. Doctor percent/commissionRate fields');
            console.log('   3. Backend errors during payment creation');
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugSalaryFull();
