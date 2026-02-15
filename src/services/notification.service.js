/**
 * Notification Service
 * 
 * Telegram va SMS bildirishnomalar uchun servis.
 */

import { sendTelegramMessage } from '../lib/telegramBot.js';
import { sendSMS } from '../lib/sms.js';

/**
 * Telegram bot orqali xabar yuborish
 * 
 * @param {string} userId - User ID (telegramId olish uchun)
 * @param {string} message - Yuboriladi message
 */
export const sendTelegramNotification = async (userId, message) => {
    try {
        const { User } = await import('../models/User.js');
        const user = await User.findById(userId).select('telegramId').lean();

        if (!user || !user.telegramId) {
            console.log(`[TELEGRAM] User ${userId} has no Telegram ID`);
            return { success: false, message: 'No Telegram ID' };
        }

        const result = await sendTelegramMessage(user.telegramId, message);

        if (result.success) {
            console.log(`📱 [TELEGRAM] Sent to ${user.telegramId}`);
        } else {
            console.error(`📱 [TELEGRAM] Failed:`, result.error);
        }

        return result;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * SMS orqali xabar yuborish
 * 
 * @param {string} phone - Telefon raqami
 * @param {string} message - Yuboriladi message
 */
export const sendSMSNotification = async (phone, message) => {
    try {
        const result = await sendSMS(phone, message);

        if (result.success) {
            console.log(`📨 [SMS] Sent to ${phone}`);
        } else {
            console.error(`📨 [SMS] Failed:`, result.error);
        }

        return result;
    } catch (error) {
        console.error('SMS notification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Bemor chaqirilganda bildirishnoma yuborish
 * 
 * @param {Object} queueEntry - Queue entry obyekti
 */
export const notifyPatientCalled = async (queueEntry) => {
    try {
        const message = `🔔 Sizning navbatingiz keldi! №${queueEntry.queueNumber}\n\nIltimos, shifokor xonasiga kiring.`;

        // Telegram va SMS yuborish
        await sendTelegramNotification(queueEntry.patientId, message);
        // await sendSMSNotification(queueEntry.patientId.phone, message);

        console.log(`✅ Bemor chaqirildi bildirishnomasi: №${queueEntry.queueNumber}`);
    } catch (error) {
        console.error('Notify patient called error:', error);
    }
};

/**
 * Navbat yaqinlashganda ogohlantirish
 * 
 * @param {Object} queueEntry - Queue entry obyekti
 * @param {number} position - Navbatdagi pozitsiya (1, 2, 3...)
 */
export const notifyQueueApproaching = async (queueEntry, position) => {
    try {
        if (position <= 3) {
            const message = `⏰ Sizning navbatingiz yaqinlashmoqda!\n\nNavbatdagi pozitsiya: ${position}\nSizning raqamingiz: №${queueEntry.queueNumber}`;

            await sendTelegramNotification(queueEntry.patientId, message);

            console.log(`✅ Navbat yaqinlashdi bildirishnomasi: №${queueEntry.queueNumber}, pozitsiya: ${position}`);
        }
    } catch (error) {
        console.error('Notify queue approaching error:', error);
    }
};

/**
 * Xizmat tugaganda bildirishnoma
 * 
 * @param {Object} queueEntry - Queue entry obyekti
 */
export const notifyServiceCompleted = async (queueEntry) => {
    try {
        const message = `✅ Xizmat yakunlandi!\n\nRahmat, sog' bo'ling!`;

        await sendTelegramNotification(queueEntry.patientId, message);

        console.log(`✅ Xizmat tugadi bildirishnomasi: №${queueEntry.queueNumber}`);
    } catch (error) {
        console.error('Notify service completed error:', error);
    }
};

// ============ DOCTOR NOTIFICATIONS ============

/**
 * Shifokorga yangi qabul haqida bildirishnoma
 */
export const notifyDoctorNewAppointment = async (appointmentId) => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName phone')
            .populate('doctorId', 'firstName lastName userId')
            .populate('serviceIds', 'name')
            .lean();

        if (!appointment) return { success: false, message: 'Appointment not found' };

        const doctor = appointment.doctorId;
        const patient = appointment.patientId;
        const services = appointment.serviceIds?.map(s => s.name).join(', ') || 'Konsultatsiya';
        const time = appointment.startAt ? new Date(appointment.startAt).toLocaleString('uz-UZ') : '';

        const message = `🔔 *Yangi qabul!*\n\n👤 Bemor: ${patient.firstName} ${patient.lastName}\n📞 Telefon: ${patient.phone || '-'}\n🩺 Xizmat: ${services}\n⏰ Vaqt: ${time}\n\nQabul tafsilotlari tizimda mavjud.`;

        console.log(`[NOTIFICATION] Doctor ${doctor.firstName} ${doctor.lastName}:`, message);

        // TODO: Send via Telegram/SMS to doctor
        return { success: true, message };
    } catch (error) {
        console.error('Notify doctor new appointment error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Shifokorga qabul bekor qilingani haqida bildirishnoma
 */
export const notifyDoctorCancelledAppointment = async (appointmentId, reason = '') => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName phone')
            .populate('doctorId', 'firstName lastName')
            .lean();

        if (!appointment) return { success: false, message: 'Appointment not found' };

        const doctor = appointment.doctorId;
        const patient = appointment.patientId;
        const time = appointment.startAt ? new Date(appointment.startAt).toLocaleString('uz-UZ') : '';

        const message = `❌ *Qabul bekor qilindi*\n\n👤 Bemor: ${patient.firstName} ${patient.lastName}\n⏰ Vaqt: ${time}${reason ? `\n📝 Sabab: ${reason}` : ''}\n\nUshbu qabul bekor qilindi.`;

        console.log(`[NOTIFICATION] Doctor ${doctor.firstName} ${doctor.lastName}:`, message);

        return { success: true, message };
    } catch (error) {
        console.error('Notify doctor cancelled appointment error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Shifokorga kunlik jadval haqida bildirishnoma
 */
export const notifyDoctorsDailySchedule = async () => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            startAt: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled', 'waiting'] }
        })
            .populate('doctorId', 'firstName lastName')
            .populate('patientId', 'firstName lastName')
            .lean();

        // Group by doctor
        const byDoctor = {};
        appointments.forEach(apt => {
            const docId = apt.doctorId._id.toString();
            if (!byDoctor[docId]) {
                byDoctor[docId] = {
                    doctor: apt.doctorId,
                    appointments: []
                };
            }
            byDoctor[docId].appointments.push(apt);
        });

        // Send to each doctor
        for (const docId in byDoctor) {
            const { doctor, appointments } = byDoctor[docId];

            const list = appointments
                .map((apt, i) => {
                    const time = new Date(apt.startAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                    const patient = apt.patientId;
                    return `${i + 1}. ${time} - ${patient.firstName} ${patient.lastName}`;
                })
                .join('\n');

            const message = `📅 *Bugungi kun tartibi*\n\nHurmatli ${doctor.firstName} ${doctor.lastName}!\n\nBugun sizda ${appointments.length} ta qabul:\n\n${list}\n\nOmad tilaymiz! 💪`;

            console.log(`[DAILY SCHEDULE] Doctor ${doctor.firstName}:`, message);
        }

        return { success: true, count: Object.keys(byDoctor).length };
    } catch (error) {
        console.error('Notify doctors daily schedule error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Bemorga qabul eslatmasi
 */
export const notifyAppointmentReminder = async (appointmentId) => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName phone telegramId')
            .populate('doctorId', 'firstName lastName spec')
            .populate('serviceIds', 'name')
            .lean();

        if (!appointment) return { success: false, message: 'Appointment not found' };

        const patient = appointment.patientId;
        const doctor = appointment.doctorId;
        const services = appointment.serviceIds?.map(s => s.name).join(', ') || 'Konsultatsiya';
        const time = appointment.startAt ? new Date(appointment.startAt).toLocaleString('uz-UZ') : '';

        const message = `🔔 *Qabul eslatmasi*\n\nHurmatli ${patient.firstName}!\n\nSizning qabulingiz:\n👨‍⚕️ Shifokor: ${doctor.firstName} ${doctor.lastName} (${doctor.spec || ''})\n🩺 Xizmat: ${services}\n⏰ Vaqt: ${time}\n\nIltimos, o'z vaqtida keling!`;

        // Send via Telegram if available
        if (patient.telegramId) {
            await sendTelegramNotification(patient._id, message);
        }

        console.log(`[REMINDER] Patient ${patient.firstName} ${patient.lastName}:`, message);

        return { success: true, message };
    } catch (error) {
        console.error('Notify appointment reminder error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Qabul tasdiqlandi bildirishnomasi
 */
export const notifyAppointmentConfirmed = async (appointmentId) => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName')
            .populate('doctorId', 'firstName lastName spec')
            .lean();

        if (!appointment) return { success: false, message: 'Appointment not found' };

        const patient = appointment.patientId;
        const doctor = appointment.doctorId;
        const time = appointment.startAt ? new Date(appointment.startAt).toLocaleString('uz-UZ') : '';

        const message = `✅ *Qabul tasdiqlandi*\n\nHurmatli ${patient.firstName}!\n\nSizning qabulingiz tasdiqlandi:\n👨‍⚕️ Shifokor: ${doctor.firstName} ${doctor.lastName}\n⏰ Vaqt: ${time}`;

        await sendTelegramNotification(patient._id, message);

        console.log(`[CONFIRMED] Patient ${patient.firstName}:`, message);

        return { success: true, message };
    } catch (error) {
        console.error('Notify appointment confirmed error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Qabul bekor qilindi bildirishnomasi (bemor uchun)
 */
export const notifyAppointmentCancelled = async (appointmentId, reason = '') => {
    try {
        const { Appointment } = await import('../models/Appointment.js');

        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName')
            .populate('doctorId', 'firstName lastName')
            .lean();

        if (!appointment) return { success: false, message: 'Appointment not found' };

        const patient = appointment.patientId;
        const doctor = appointment.doctorId;
        const time = appointment.startAt ? new Date(appointment.startAt).toLocaleString('uz-UZ') : '';

        const message = `❌ *Qabul bekor qilindi*\n\nHurmatli ${patient.firstName}!\n\nSizning qabulingiz bekor qilindi:\n👨‍⚕️ Shifokor: ${doctor.firstName} ${doctor.lastName}\n⏰ Vaqt: ${time}${reason ? `\n📝 Sabab: ${reason}` : ''}`;

        await sendTelegramNotification(patient._id, message);

        console.log(`[CANCELLED] Patient ${patient.firstName}:`, message);

        return { success: true, message };
    } catch (error) {
        console.error('Notify appointment cancelled error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * To'lov qabul qilindi bildirishnomasi
 */
export const notifyPaymentReceived = async (paymentId) => {
    try {
        const { Payment } = await import('../models/Payment.js');

        const payment = await Payment.findById(paymentId)
            .populate('patientId', 'firstName lastName')
            .lean();

        if (!payment) return { success: false, message: 'Payment not found' };

        const patient = payment.patientId;
        const amount = payment.amount || 0;

        const message = `💰 *To'lov qabul qilindi*\n\nHurmatli ${patient.firstName}!\n\nTo'lovingiz qabul qilindi:\n💵 Summa: ${amount.toLocaleString()} so'm\n📅 Sana: ${new Date().toLocaleString('uz-UZ')}\n\nRahmat!`;

        await sendTelegramNotification(patient._id, message);

        console.log(`[PAYMENT] Patient ${patient.firstName}:`, message);

        return { success: true, message };
    } catch (error) {
        console.error('Notify payment received error:', error);
        return { success: false, error: error.message };
    }
};
