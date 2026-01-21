/**
 * Notification Service
 * 
 * Bu servis kelajakda Telegram va SMS bildirishnomalar uchun ishlatiladi.
 * Hozircha faqat struktura yaratilgan.
 */

/**
 * Telegram bot orqali xabar yuborish
 * 
 * @param {string} patientId - Bemor ID
 * @param {string} message - Yuborilad message
 * 
 * Kerakli sozlamalar:
 * - TELEGRAM_BOT_TOKEN - .env faylida
 * - Patient model'da telegramChatId field
 */
export const sendTelegramNotification = async (patientId, message) => {
    try {
        // TODO: Telegram bot integratsiyasi
        // const patient = await Patient.findById(patientId);
        // if (patient.telegramChatId) {
        //     await telegramBot.sendMessage(patient.telegramChatId, message);
        // }

        console.log(`📱 Telegram xabari yuborilishi kerak: ${patientId} - ${message}`);
        return { success: true, message: 'Telegram bot sozlanmagan' };
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
 * 
 * Kerakli sozlamalar:
 * - SMS_PROVIDER_API_KEY - .env faylida
 * - SMS_PROVIDER_URL - .env faylida
 * 
 * Tavsiya: Eskiz.uz, Playmobile.uz yoki boshqa SMS provider
 */
export const sendSMSNotification = async (phone, message) => {
    try {
        // TODO: SMS provider integratsiyasi
        // const response = await axios.post(process.env.SMS_PROVIDER_URL, {
        //     phone,
        //     message,
        //     api_key: process.env.SMS_PROVIDER_API_KEY
        // });

        console.log(`📨 SMS yuborilishi kerak: ${phone} - ${message}`);
        return { success: true, message: 'SMS provider sozlanmagan' };
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

// Kelajakda qo'shilishi mumkin:
// - notifyAppointmentReminder - Qabul eslatmasi (1 soat oldin)
// - notifyAppointmentConfirmed - Qabul tasdiqlandi
// - notifyAppointmentCancelled - Qabul bekor qilindi
// - notifyPaymentReceived - To'lov qabul qilindi
