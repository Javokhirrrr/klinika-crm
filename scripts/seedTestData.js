import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Patient } from '../src/models/Patient.js';
import { Appointment } from '../src/models/Appointment.js';
import { Payment } from '../src/models/Payment.js';
import { Attendance } from '../src/models/Attendance.js';
import { Commission } from '../src/models/Commission.js';
import { QueueEntry } from '../src/models/QueueEntry.js';

async function run() {
    console.log('🌱 Test ma\'lumotlar yaratish boshlandi...\n');

    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB ulandi\n');

    // Admin userning orgId'sini topamiz
    const admin = await User.findOne({ email: 'admin@clinic.uz' });
    if (!admin) {
        console.error('❌ Admin topilmadi! Avval seedAdmin.js ishga tushiring.');
        process.exit(1);
    }

    const orgId = admin.orgId || admin._id; // Agar orgId bo'lmasa, admin ID'sini ishlataymiz
    console.log(`📋 Organization ID: ${orgId}\n`);

    // 1. XIZMATLAR YARATISH
    console.log('📝 1. Xizmatlar yaratilmoqda...');
    const services = [
        {
            name: 'Dastlabki konsultatsiya',
            category: 'Konsultatsiya',
            price: 150000,
            duration: 30,
            code: 'CONS-001',
            description: 'Shifokor bilan birinchi uchrashiv',
            isActive: true
        },
        {
            name: 'Takroriy konsultatsiya',
            category: 'Konsultatsiya',
            price: 100000,
            duration: 20,
            code: 'CONS-002',
            description: 'Qayta ko\'rik',
            isActive: true
        },
        {
            name: 'Umumiy qon tahlili',
            category: 'Laboratoriya',
            price: 50000,
            duration: 15,
            code: 'LAB-001',
            description: 'Umumiy qon tahlili',
            isActive: true
        },
        {
            name: 'Biokimyoviy tahlil',
            category: 'Laboratoriya',
            price: 80000,
            duration: 20,
            code: 'LAB-002',
            description: 'Qon biokimyosi',
            isActive: true
        },
        {
            name: 'Ultratovush tekshiruvi (USI)',
            category: 'Diagnostika',
            price: 200000,
            duration: 30,
            code: 'DIAG-001',
            description: 'Ultratovush diagnostikasi',
            isActive: true
        },
        {
            name: 'EKG (Elektrokardiogramma)',
            category: 'Diagnostika',
            price: 70000,
            duration: 15,
            code: 'DIAG-002',
            description: 'Yurak faoliyatini tekshirish',
            isActive: true
        },
        {
            name: 'Rentgen tekshiruvi',
            category: 'Diagnostika',
            price: 120000,
            duration: 20,
            code: 'DIAG-003',
            description: 'Rentgen diagnostikasi',
            isActive: true
        },
        {
            name: 'Vaksinatsiya',
            category: 'Profilaktika',
            price: 90000,
            duration: 10,
            code: 'PREV-001',
            description: 'Emlash xizmati',
            isActive: true
        }
    ];

    // Eski xizmatlarni o'chirish (test muhitda)
    await Service.deleteMany({ orgId });

    for (const svc of services) {
        await Service.create({ ...svc, orgId });
    }
    console.log(`   ✅ ${services.length} ta xizmat yaratildi\n`);

    // 2. SHIFOKORLAR YARATISH
    console.log('👨‍⚕️ 2. Shifokorlar yaratilmoqda...');
    const doctors = [
        {
            name: 'Dr. Alisher Karimov',
            email: 'alisher.karimov@clinic.uz',
            role: 'doctor',
            phone: '+998901234567',
            specialty: 'Terapevt',
            department: 'Terapiya'
        },
        {
            name: 'Dr. Nilufar Mahmudova',
            email: 'nilufar.mahmudova@clinic.uz',
            role: 'doctor',
            phone: '+998901234568',
            specialty: 'Pediatr',
            department: 'Pediatriya'
        },
        {
            name: 'Dr. Sardor Yusupov',
            email: 'sardor.yusupov@clinic.uz',
            role: 'doctor',
            phone: '+998901234569',
            specialty: 'Kardiolog',
            department: 'Kardiologiya'
        }
    ];

    const createdDoctors = [];
    for (const doc of doctors) {
        const existing = await User.findOne({ email: doc.email });
        if (existing) {
            createdDoctors.push(existing);
        } else {
            const pwdHash = await bcrypt.hash('doctor123', 10);
            const newDoc = await User.create({
                ...doc,
                passwordHash: pwdHash,
                orgId,
                isActive: true,
                isDeleted: false
            });
            createdDoctors.push(newDoc);
        }
    }
    console.log(`   ✅ ${createdDoctors.length} ta shifokor yaratildi\n`);

    // 3. BEMORLAR YARATISH
    console.log('🏥 3. Bemorlar yaratilmoqda...');
    const patients = [
        {
            firstName: 'Jasur',
            lastName: 'Abdullayev',
            phone: '+998901111111',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'male',
            address: 'Toshkent sh, Chilonzor t-ni',
            bloodType: 'A+'
        },
        {
            firstName: 'Dilnoza',
            lastName: 'Rahimova',
            phone: '+998901111112',
            dateOfBirth: new Date('1985-08-22'),
            gender: 'female',
            address: 'Toshkent sh, Yunusobod t-ni',
            bloodType: 'O+'
        },
        {
            firstName: 'Aziz',
            lastName: 'Toshmatov',
            phone: '+998901111113',
            dateOfBirth: new Date('2000-12-10'),
            gender: 'male',
            address: 'Toshkent sh, Olmazor t-ni',
            bloodType: 'B+'
        },
        {
            firstName: 'Malika',
            lastName: 'Karimova',
            phone: '+998901111114',
            dateOfBirth: new Date('1995-03-18'),
            gender: 'female',
            address: 'Toshkent sh, Mirobod t-ni',
            bloodType: 'AB+'
        },
        {
            firstName: 'Shohruh',
            lastName: 'Vohidov',
            phone: '+998901111115',
            dateOfBirth: new Date('1988-07-25'),
            gender: 'male',
            address: 'Toshkent sh, Sergeli t-ni',
            bloodType: 'O-'
        }
    ];

    await Patient.deleteMany({ orgId });
    const createdPatients = [];
    for (const pat of patients) {
        const newPat = await Patient.create({ ...pat, orgId });
        createdPatients.push(newPat);
    }
    console.log(`   ✅ ${createdPatients.length} ta bemor yaratildi\n`);

    // 4. UCHRASHUVLAR YARATISH
    console.log('📅 4. Uchrashuvlar yaratilmoqda...');
    const appointments = [];
    const today = new Date();
    const firstService = await Service.findOne({ orgId });

    // Bugungi uchrashuvlar
    for (let i = 0; i < 3; i++) {
        const startAt = new Date(today);
        startAt.setHours(9 + i * 2, 0, 0, 0);

        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 30);

        appointments.push({
            orgId,
            patientId: createdPatients[i]._id,
            doctorId: createdDoctors[i % createdDoctors.length]._id,
            serviceIds: [firstService._id],
            startAt,
            endAt,
            status: i === 0 ? 'done' : i === 1 ? 'in_progress' : 'scheduled',
            notes: `Test ${i + 1} uchrashov`,
            price: firstService.price
        });
    }

    // Kechagi uchrashuvlar (tarix uchun)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (let i = 0; i < 2; i++) {
        const startAt = new Date(yesterday);
        startAt.setHours(10 + i * 3, 0, 0, 0);

        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 30);

        appointments.push({
            orgId,
            patientId: createdPatients[i + 3]._id,
            doctorId: createdDoctors[i % createdDoctors.length]._id,
            serviceIds: [firstService._id],
            startAt,
            endAt,
            status: 'done',
            notes: `Kecha ${i + 1} uchrashov`,
            price: firstService.price
        });
    }

    await Appointment.deleteMany({ orgId });
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`   ✅ ${createdAppointments.length} ta uchrashov yaratildi\n`);

    // 5. TO'LOVLAR YARATISH
    console.log('💰 5. To\'lovlar yaratilmoqda...');
    const payments = [];

    // Uchrashuvlar uchun to'lovlar
    for (let i = 0; i < createdAppointments.length; i++) {
        const apt = createdAppointments[i];
        if (apt.status === 'done' && apt.price) {
            payments.push({
                orgId,
                patientId: apt.patientId,
                appointmentId: apt._id,
                amount: apt.price,
                method: i % 2 === 0 ? 'cash' : 'card',
                status: 'completed',
                description: `To'lov uchrashov uchun`
            });
        }
    }

    await Payment.deleteMany({ orgId });
    const createdPayments = await Payment.insertMany(payments);
    console.log(`   ✅ ${createdPayments.length} ta to'lov yaratildi\n`);

    // 6. DAVOMAT YARATISH
    console.log('⏰ 6. Davomat yozuvlari yaratilmoqda...');
    const attendances = [];

    // Oxirgi 5 kun uchun
    for (let day = 0; day < 5; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);

        for (const doctor of createdDoctors) {
            const clockIn = new Date(date);
            const isLate = day % 2 === 0;
            clockIn.setHours(isLate ? 9 : 8, isLate ? 15 : 55, 0, 0);

            const clockOut = new Date(date);
            clockOut.setHours(18, 0, 0, 0);

            attendances.push({
                orgId,
                userId: doctor._id,
                date,
                clockIn,
                clockOut,
                status: isLate ? 'late' : 'on_time',
                lateMinutes: isLate ? 15 : 0,
                workHours: 9
            });
        }
    }

    await Attendance.deleteMany({ orgId });
    const createdAttendances = await Attendance.insertMany(attendances);
    console.log(`   ✅ ${createdAttendances.length} ta davomat yozuvi yaratildi\n`);

    // 7. NAVBAT YARATISH
    console.log('📋 7. Navbat yozuvlari yaratilmoqda...');
    const queueEntries = [];

    // Bugungi navbat
    for (let i = 0; i < 3; i++) {
        const joinedAt = new Date();
        joinedAt.setHours(8, 30 + i * 15, 0, 0);

        queueEntries.push({
            orgId,
            patientId: createdPatients[i]._id,
            serviceId: firstService._id,
            department: createdDoctors[i % createdDoctors.length].department,
            status: i === 0 ? 'in_service' : 'waiting',
            queueNumber: i + 1,
            joinedAt,
            priority: 'normal'
        });
    }

    await QueueEntry.deleteMany({ orgId });
    const createdQueueEntries = await QueueEntry.insertMany(queueEntries);
    console.log(`   ✅ ${createdQueueEntries.length} ta navbat yozuvi yaratildi\n`);

    // 8. KOMISSIYA YARATISH
    console.log('💵 8. Komissiya yozuvlari yaratilmoqda...');
    const commissions = [];

    for (const payment of createdPayments) {
        const appointment = await Appointment.findById(payment.appointmentId);
        if (appointment) {
            commissions.push({
                orgId,
                userId: appointment.doctorId,
                paymentId: payment._id,
                appointmentId: appointment._id,
                patientId: payment.patientId,
                baseAmount: payment.amount,
                percentage: 15, // 15% komissiya
                amount: payment.amount * 0.15,
                status: 'pending'
            });
        }
    }

    await Commission.deleteMany({ orgId });
    const createdCommissions = await Commission.insertMany(commissions);
    console.log(`   ✅ ${createdCommissions.length} ta komissiya yozuvi yaratildi\n`);

    console.log('\n🎉 YAKUNIY NATIJA:');
    console.log('==================');
    console.log(`✅ Xizmatlar:        ${services.length}`);
    console.log(`✅ Shifokorlar:      ${createdDoctors.length}`);
    console.log(`✅ Bemorlar:         ${createdPatients.length}`);
    console.log(`✅ Uchrashuvlar:     ${createdAppointments.length}`);
    console.log(`✅ To'lovlar:        ${createdPayments.length}`);
    console.log(`✅ Davomat:          ${createdAttendances.length}`);
    console.log(`✅ Navbat:           ${createdQueueEntries.length}`);
    console.log(`✅ Komissiyalar:     ${createdCommissions.length}`);
    console.log('==================\n');

    console.log('🚀 Test ma\'lumotlar muvaffaqiyatli yaratildi!');
    console.log('📱 Browserda http://localhost:5173 ochib ko\'ring!\n');

    await mongoose.disconnect();
}

run().catch((e) => {
    console.error('❌ Xatolik:', e);
    process.exit(1);
});
