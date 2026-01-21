
import mongoose from 'mongoose';
import { Appointment } from './src/models/Appointment.js';
import { Doctor } from './src/models/Doctor.js';
import { User } from './src/models/User.js';
import { env } from './src/config/env.js'; // Assuming env config exists

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/klinika-crm');
        console.log('Connected');

        const appt = await Appointment.findOne({ doctorId: { $ne: null } });
        if (!appt) {
            console.log('No appointment with doctorId found');
            return;
        }
        console.log('Found ID:', appt.doctorId);

        const asUser = await User.findById(appt.doctorId);
        const asDoctor = await Doctor.findById(appt.doctorId);

        console.log('Exists in Users?', !!asUser);
        console.log('Exists in Doctors?', !!asDoctor);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
