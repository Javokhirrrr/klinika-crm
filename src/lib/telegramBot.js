// src/lib/telegramBot.js
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send message via Telegram Bot
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} text - Message text (supports Markdown)
 * @param {object} options - Additional options
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('Telegram bot not configured. Set TELEGRAM_BOT_TOKEN in .env');
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: options.parseMode || 'Markdown',
            disable_web_page_preview: options.disableWebPagePreview || false,
            disable_notification: options.disableNotification || false,
            reply_markup: options.replyMarkup || undefined
        });

        if (response.data && response.data.ok) {
            return {
                success: true,
                messageId: response.data.result.message_id
            };
        }

        return {
            success: false,
            error: response.data?.description || 'Message sending failed'
        };
    } catch (error) {
        console.error('Telegram message sending error:', error);
        return {
            success: false,
            error: error.response?.data?.description || error.message || 'Message sending failed'
        };
    }
}

/**
 * Send message with inline keyboard
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} text - Message text
 * @param {Array} buttons - Array of button rows [[{text, callback_data}]]
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendMessageWithButtons(chatId, text, buttons) {
    return sendTelegramMessage(chatId, text, {
        replyMarkup: {
            inline_keyboard: buttons
        }
    });
}

/**
 * Send photo via Telegram Bot
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} photoUrl - Photo URL or file_id
 * @param {string} caption - Photo caption
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendTelegramPhoto(chatId, photoUrl, caption = '') {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption,
            parse_mode: 'Markdown'
        });

        if (response.data && response.data.ok) {
            return {
                success: true,
                messageId: response.data.result.message_id
            };
        }

        return {
            success: false,
            error: response.data?.description || 'Photo sending failed'
        };
    } catch (error) {
        console.error('Telegram photo sending error:', error);
        return {
            success: false,
            error: error.response?.data?.description || error.message || 'Photo sending failed'
        };
    }
}

/**
 * Send document via Telegram Bot
 * @param {string|number} chatId - Telegram chat ID
 * @param {string} documentUrl - Document URL or file_id
 * @param {string} caption - Document caption
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendTelegramDocument(chatId, documentUrl, caption = '') {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, {
            chat_id: chatId,
            document: documentUrl,
            caption: caption,
            parse_mode: 'Markdown'
        });

        if (response.data && response.data.ok) {
            return {
                success: true,
                messageId: response.data.result.message_id
            };
        }

        return {
            success: false,
            error: response.data?.description || 'Document sending failed'
        };
    } catch (error) {
        console.error('Telegram document sending error:', error);
        return {
            success: false,
            error: error.response?.data?.description || error.message || 'Document sending failed'
        };
    }
}

/**
 * Answer callback query (for inline keyboard buttons)
 * @param {string} callbackQueryId - Callback query ID
 * @param {string} text - Text to show in alert
 * @param {boolean} showAlert - Show as alert or toast
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: text,
            show_alert: showAlert
        });

        return {
            success: response.data && response.data.ok
        };
    } catch (error) {
        console.error('Telegram callback answer error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get bot info
 * @returns {Promise<{success: boolean, bot?: object, error?: string}>}
 */
export async function getBotInfo() {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);

        if (response.data && response.data.ok) {
            return {
                success: true,
                bot: response.data.result
            };
        }

        return {
            success: false,
            error: 'Failed to get bot info'
        };
    } catch (error) {
        console.error('Telegram bot info error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Set webhook for receiving updates
 * @param {string} webhookUrl - Webhook URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setWebhook(webhookUrl) {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/setWebhook`, {
            url: webhookUrl
        });

        return {
            success: response.data && response.data.ok
        };
    } catch (error) {
        console.error('Telegram webhook setup error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export default object with all functions
export default {
    sendTelegramMessage,
    sendMessageWithButtons,
    sendTelegramPhoto,
    sendTelegramDocument,
    answerCallbackQuery,
    getBotInfo,
    setWebhook
};
