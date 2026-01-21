import { generatePaymentReceipt } from '../services/pdf.service.js';
import { sendReceiptViaTelegram } from '../services/telegram.service.js';

/**
 * Generate and send payment receipt
 */
export async function generateAndSendReceipt(payment, patient, orgId) {
    try {
        // Generate receipt number
        const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
        payment.receiptNumber = receiptNumber;

        // Generate PDF
        const pdfPath = await generatePaymentReceipt(
            payment,
            patient,
            null, // service
            null, // doctor
            { name: 'Klinika CRM', website: 'www.klinika.uz' }
        );

        payment.receiptPath = pdfPath;
        await payment.save();

        console.log(`✅ PDF chek yaratildi: ${receiptNumber}`);

        // Send via Telegram if patient connected
        if (patient.telegramChatId) {
            const result = await sendReceiptViaTelegram(
                orgId,
                patient.telegramChatId,
                pdfPath,
                payment
            );

            if (result.success) {
                payment.receiptSentAt = new Date();
                payment.receiptSentVia = 'telegram';
                await payment.save();
                console.log(`✅ Chek Telegram orqali yuborildi: ${receiptNumber}`);
            }
        }

        return { success: true, receiptNumber };
    } catch (error) {
        console.error('❌ PDF chek xatoligi:', error);
        return { success: false, error: error.message };
    }
}
