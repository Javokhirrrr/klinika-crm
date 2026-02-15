// src/lib/sms.js
import axios from 'axios';

const SMS_PROVIDER_URL = process.env.SMS_PROVIDER_URL;
const SMS_API_KEY = process.env.SMS_PROVIDER_API_KEY;
const SMS_FROM = process.env.SMS_FROM || 'Klinika';

/**
 * Send SMS via Eskiz.uz or other provider
 * @param {string} phone - Phone number in format +998XXXXXXXXX
 * @param {string} message - SMS message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendSMS(phone, message) {
    if (!SMS_PROVIDER_URL || !SMS_API_KEY) {
        console.warn('SMS provider not configured. Set SMS_PROVIDER_URL and SMS_PROVIDER_API_KEY in .env');
        return { success: false, error: 'SMS provider not configured' };
    }

    try {
        // Format phone number (remove + and spaces)
        const formattedPhone = phone.replace(/[^0-9]/g, '');

        // Eskiz.uz API format
        const response = await axios.post(
            SMS_PROVIDER_URL,
            {
                mobile_phone: formattedPhone,
                message: message,
                from: SMS_FROM
            },
            {
                headers: {
                    'Authorization': `Bearer ${SMS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.status === 'success') {
            return {
                success: true,
                messageId: response.data.id || response.data.message_id
            };
        }

        return {
            success: false,
            error: response.data?.message || 'SMS sending failed'
        };
    } catch (error) {
        console.error('SMS sending error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'SMS sending failed'
        };
    }
}

/**
 * Send SMS to multiple recipients
 * @param {string[]} phones - Array of phone numbers
 * @param {string} message - SMS message text
 * @returns {Promise<{success: boolean, sent: number, failed: number, results: Array}>}
 */
export async function sendBulkSMS(phones, message) {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
        const result = await sendSMS(phone, message);
        results.push({ phone, ...result });

        if (result.success) {
            sent++;
        } else {
            failed++;
        }

        // Add delay to avoid rate limiting (100ms between messages)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
        success: sent > 0,
        sent,
        failed,
        results
    };
}

/**
 * Format phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If starts with 998, add +
    if (digits.startsWith('998')) {
        return `+${digits}`;
    }

    // If starts with 8 or 9, assume Uzbekistan
    if (digits.startsWith('8') || digits.startsWith('9')) {
        return `+998${digits.substring(1)}`;
    }

    return `+${digits}`;
}

/**
 * Validate Uzbekistan phone number
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export function isValidUzbekistanPhone(phone) {
    const digits = phone.replace(/\D/g, '');

    // Should be 12 digits (998XXXXXXXXX)
    if (digits.length !== 12) return false;

    // Should start with 998
    if (!digits.startsWith('998')) return false;

    // Valid operator codes: 90, 91, 93, 94, 95, 97, 98, 99, 33, 88, 77
    const operatorCode = digits.substring(3, 5);
    const validCodes = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77'];

    return validCodes.includes(operatorCode);
}

// Export default object with all functions
export default {
    sendSMS,
    sendBulkSMS,
    formatPhoneNumber,
    isValidUzbekistanPhone
};
