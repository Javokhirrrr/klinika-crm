import TelegramBot from 'node-telegram-bot-api';
import { Bot } from '../models/Bot.js';
import { Patient } from '../models/Patient.js';
import { env } from '../config/env.js';

// Store bot instances by orgId
const bots = new Map();

/**
 * Initialize all Telegram Bots from database
 */
export const initTelegramBot = async () => {
    try {
        // Load all active bots from database
        const activeBots = await Bot.find({ isActive: true });

        if (activeBots.length === 0) {
            console.log('⚠️ Hech qanday faol bot topilmadi');
            console.log('💡 Sozlamalar → Bildirishnomalar → Bot qo\'shish');
            return;
        }

        console.log(`📱 ${activeBots.length} ta bot topildi`);

        // Initialize each bot
        for (const botConfig of activeBots) {
            try {
                await initializeSingleBot(botConfig);
            } catch (error) {
                console.error(`❌ Bot ${botConfig.name} ishga tushmadi:`, error.message);
            }
        }

        console.log(`✅ ${bots.size} ta bot muvaffaqiyatli ishga tushdi`);
    } catch (error) {
        console.error('❌ Telegram botlarni yuklashda xatolik:', error);
    }
};

/**
 * Initialize single bot instance
 */
async function initializeSingleBot(botConfig) {
    const { orgId, token, name } = botConfig;

    // Create bot instance
    const bot = new TelegramBot(token, { polling: true });

    // Store bot instance
    bots.set(orgId.toString(), bot);

    console.log(`✅ Bot ishga tushdi: ${name} (${orgId})`);

    // Setup commands for this bot
    setupBotCommands(bot, orgId);

    // Error handling
    bot.on('polling_error', (error) => {
        console.error(`Polling error for ${name}:`, error.message);
    });
}

/**
 * Setup bot commands and handlers
 */
function setupBotCommands(bot, orgId) {
    // /start command
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
            if (patient) {
                await sendMainMenu(bot, chatId, patient);
            } else {
                await bot.sendMessage(chatId,
                    `🏥 *Klinika CRM Botiga xush kelibsiz!*\n\nTelefon raqamingizni yuboring:`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Start command error:', error);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi.');
        }
    });

    // /karta yoki /profil komandasi
    bot.onText(/\/(karta|profil|card|profile)/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
            if (!patient) {
                return bot.sendMessage(chatId, "❌ Siz hali ro'yxatdan o'tmagansiz. /start bosing.");
            }
            await sendPatientCard(bot, chatId, patient);
        } catch (e) {
            console.error('/karta error:', e);
        }
    });

    // Handle contact (phone number)
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        const phoneNumber = contact.phone_number;

        try {
            // Normalize phone number
            let normalizedPhone = phoneNumber.replace(/\D/g, '');
            if (normalizedPhone.startsWith('998')) {
                normalizedPhone = '+' + normalizedPhone;
            } else if (!normalizedPhone.startsWith('+')) {
                normalizedPhone = '+998' + normalizedPhone;
            }

            // Find patient by phone in this organization
            const patient = await Patient.findOne({
                orgId,
                phone: { $regex: normalizedPhone.slice(-9), $options: 'i' }
            });

            if (patient) {
                // Patient found - save chat ID
                patient.telegramChatId = chatId.toString();
                patient.telegramUsername = msg.from.username || null;
                patient.telegramVerified = true;
                patient.telegramVerifiedAt = new Date();
                await patient.save();

                await bot.sendMessage(chatId,
                    `✅ *Tasdiqlandi!*\n\n` +
                    `Salom, ${patient.firstName} ${patient.lastName || ''}!\n\n` +
                    `Siz muvaffaqiyatli ro'yxatdan o'tdingiz.`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );

                // Send main menu
                await sendMainMenu(bot, chatId, patient);
            } else {
                // Patient not found
                await bot.sendMessage(chatId,
                    `❌ *Kechirasiz!*\n\n` +
                    `Sizning telefon raqamingiz bizning bazamizda topilmadi.\n\n` +
                    `Iltimos, klinikaga murojaat qiling va ro'yxatdan o'ting.\n\n` +
                    `📞 Telefon raqam: +998 XX XXX XX XX`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Contact handler error:', error);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        }
    });

    // /help command
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;

        const helpText = `
📚 *Yordam*

*Mavjud komandalar:*
/start - Botni boshlash
/help - Yordam
/myqueue - Navbatim
/payments - To'lovlarim
/history - Kasallik tarixim

*Qanday foydalanish:*
1. /start buyrug'i bilan boshlang
2. Telefon raqamingizni yuboring
3. Tasdiqlangandan keyin barcha funksiyalardan foydalaning

*Savol-javoblar:*
Agar savolingiz bo'lsa, klinikaga murojaat qiling.
        `;

        await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    });

    // Callback query handler
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;

        try {
            await bot.answerCallbackQuery(query.id);

            switch (data) {
                case 'my_card': {
                    const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
                    if (patient) await sendPatientCard(bot, chatId, patient);
                    else await bot.sendMessage(chatId, "❌ Bemor topilmadi. /start bosing.");
                    break;
                }
                case 'back_menu': {
                    const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
                    if (patient) await sendMainMenu(bot, chatId, patient);
                    break;
                }
                case 'queue':
                    await handleMyQueue(bot, chatId, orgId);
                    break;
                case 'payments':
                    await handleMyPayments(bot, chatId, orgId);
                    break;
                case 'history':
                    await handleMyHistory(bot, chatId, orgId);
                    break;
                case 'appointments':
                    await handleMyAppointments(bot, chatId, orgId);
                    break;
                case 'settings':
                    await handleSettings(bot, chatId);
                    break;
                case 'help':
                    await bot.sendMessage(chatId, 'Yordam: /karta - bemor kartangiz, /start - boshlash');
                    break;
                default:
                    await bot.sendMessage(chatId, "Noma'lum buyruq");
            }
        } catch (error) {
            console.error('Callback query error:', error);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
        }
    });
}

/**
 * Send main menu
 */
async function sendMainMenu(bot, chatId, patient) {
    const menuText = `🏥 *Asosiy Menyu*\n\nSalom, ${patient.firstName}!\nQuyidagi funksiyalardan foydalaning:`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '👤 Bemor Kartam', callback_data: 'my_card' },
            ],
            [
                { text: '🎫 Navbatim', callback_data: 'queue' },
                { text: '💳 To\'lovlar', callback_data: 'payments' }
            ],
            [
                { text: '📋 Kasallik tarixi', callback_data: 'history' },
                { text: '📅 Qabullar', callback_data: 'appointments' }
            ],
            [
                { text: '⚙️ Sozlamalar', callback_data: 'settings' },
                { text: '❓ Yordam', callback_data: 'help' }
            ]
        ]
    };

    await bot.sendMessage(chatId, menuText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

/**
 * Bemor kartasini yuborish
 */
async function sendPatientCard(bot, chatId, patient) {
    let age = '';
    if (patient.birthDate) {
        const yil = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
        age = `${yil} yosh`;
    }
    const genderLabel = patient.gender === 'male' ? '👨 Erkak'
        : patient.gender === 'female' ? '👩 Ayol' : '';
    const regDate = patient.createdAt
        ? new Date(patient.createdAt).toLocaleDateString('uz-UZ')
        : '—';

    const rows = [
        `╔══════════════════════╗`,
        `║  🏥  BEMOR KARTASI   ║`,
        `╚══════════════════════╝`,
        ``,
        `*${patient.firstName} ${patient.lastName || ''}*`,
    ];

    if (patient.cardNo) rows.push(`🎫 Karta \u2116: \`${patient.cardNo}\``);
    if (patient.phone) rows.push(`📞 Telefon: \`${patient.phone}\``);
    if (age) rows.push(`🎂 Yosh: ${age}`);
    if (genderLabel) rows.push(`⚧️  Jins: ${genderLabel}`);
    if (patient.address) rows.push(`📍 Manzil: ${patient.address}`);
    if (patient.bloodType) rows.push(`🩸 Qon guruhi: *${patient.bloodType}*`);

    rows.push(``);
    rows.push(`━━━━━━━━━━━━━━━━━━━━━━`);
    rows.push(`📅 Ro'yxatga olingan: ${regDate}`);
    rows.push(``);
    rows.push(`_ℹ️ Ushbu karta ma'lumot uchun._`);

    await bot.sendMessage(chatId, rows.join('\n'), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📅 Qabullarim', callback_data: 'appointments' },
                    { text: '🔄 Yangilash', callback_data: 'my_card' },
                ],
                [{ text: '🏠 Bosh menyu', callback_data: 'back_menu' }]
            ]
        }
    });
}

/**
 * Handle My Queue
 */
async function handleMyQueue(bot, chatId, orgId) {
    try {
        const patient = await Patient.findOne({
            orgId,
            telegramChatId: chatId.toString()
        });

        if (!patient) {
            await bot.sendMessage(chatId, '❌ Bemor topilmadi');
            return;
        }

        // TODO: Get queue info from QueueEntry model
        await bot.sendMessage(chatId,
            `🎫 *Navbatim*\n\n` +
            `Hozirda navbatda yo'qsiz.\n\n` +
            `Qabul uchun klinikaga murojaat qiling.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('My queue error:', error);
        await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
    }
}

/**
 * Handle My Payments
 */
async function handleMyPayments(bot, chatId, orgId) {
    try {
        await bot.sendMessage(chatId,
            `💳 *To'lovlarim*\n\n` +
            `To'lovlar tarixi hali mavjud emas.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('My payments error:', error);
        await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
    }
}

/**
 * Handle My History
 */
async function handleMyHistory(bot, chatId, orgId) {
    try {
        const patient = await Patient.findOne({
            orgId,
            telegramChatId: chatId.toString()
        });

        if (!patient) {
            await bot.sendMessage(chatId, '❌ Bemor topilmadi');
            return;
        }

        // Get medical history
        const { MedicalHistory } = await import('../models/MedicalHistory.js');

        const history = await MedicalHistory.find({
            orgId,
            patientId: patient._id
        })
            .sort({ date: -1 })
            .limit(5)
            .populate('doctorId', 'firstName lastName spec');

        if (history.length === 0) {
            await bot.sendMessage(chatId,
                `📋 *Kasallik tarixim*\n\n` +
                `Hozircha kasallik tarixi yo'q.`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Format history
        let message = `📋 *Kasallik tarixim*\n\n`;
        message += `Oxirgi ${history.length} ta yozuv:\n\n`;

        history.forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString('uz-UZ');
            const doctor = entry.doctorId ?
                `${entry.doctorId.firstName} ${entry.doctorId.lastName}` :
                'Noma\'lum';

            message += `${index + 1}. *${entry.title}*\n`;
            message += `📅 ${date}\n`;
            message += `👨‍⚕️ ${doctor}\n`;

            if (entry.description) {
                message += `📝 ${entry.description.substring(0, 100)}${entry.description.length > 100 ? '...' : ''}\n`;
            }

            if (entry.medications && entry.medications.length > 0) {
                message += `💊 Dorilar: ${entry.medications.length} ta\n`;
            }

            message += `\n`;
        });

        message += `\nBatafsil ma'lumot uchun klinikaga murojaat qiling.`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('My history error:', error);
        await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
    }
}

/**
 * Handle My Appointments
 */
async function handleMyAppointments(bot, chatId, orgId) {
    try {
        await bot.sendMessage(chatId,
            `📅 *Qabullarim*\n\n` +
            `Qabullar hali mavjud emas.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('My appointments error:', error);
        await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
    }
}

/**
 * Handle Settings
 */
async function handleSettings(bot, chatId) {
    try {
        await bot.sendMessage(chatId,
            `⚙️ *Sozlamalar*\n\n` +
            `Sozlamalar bo'limi ishlab chiqilmoqda...`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Settings error:', error);
        await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
    }
}

/**
 * Get bot instance for organization
 */
export const getBotForOrg = (orgId) => {
    return bots.get(orgId.toString());
};

/**
 * Send message to patient
 */
export const sendTelegramMessage = async (orgId, chatId, message, options = {}) => {
    const bot = getBotForOrg(orgId);

    if (!bot) {
        console.error('❌ Bot topilmadi:', orgId);
        return { success: false, error: 'Bot not found for organization' };
    }

    try {
        await bot.sendMessage(chatId, message, options);
        return { success: true };
    } catch (error) {
        console.error('❌ Telegram xabar yuborishda xatolik:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to patient
 */
export const sendPatientNotification = async (patientId, message, options = {}) => {
    try {
        const patient = await Patient.findById(patientId);

        if (!patient || !patient.telegramChatId) {
            console.log('⚠️ Bemor Telegram\'ga ulanmagan');
            return { success: false, message: 'Patient not connected to Telegram' };
        }

        return await sendTelegramMessage(patient.orgId, patient.telegramChatId, message, options);
    } catch (error) {
        console.error('Patient notification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Reload bots (when new bot added or removed)
 */
export const reloadBots = async () => {
    console.log('🔄 Botlarni qayta yuklash...');

    // Stop all existing bots
    for (const [orgId, bot] of bots.entries()) {
        try {
            await bot.stopPolling();
            console.log(`⏹️ Bot to'xtatildi: ${orgId}`);
        } catch (error) {
            console.error(`Error stopping bot ${orgId}:`, error.message);
        }
    }

    // Clear bots map
    bots.clear();

    // Reinitialize all bots
    await initTelegramBot();
};

/**
 * Send queue notification
 */
export const sendQueueNotification = async (orgId, chatId, data) => {
    const bot = getBotForOrg(orgId);

    if (!bot) {
        console.error('❌ Bot topilmadi:', orgId);
        return { success: false, error: 'Bot not found' };
    }

    let message = '';
    let options = { parse_mode: 'Markdown' };

    switch (data.type) {
        case 'added':
            message = `🎫 *Navbatga qo'shildingiz!*\n\n` +
                `📋 Navbat: №${data.queueNumber}\n` +
                `👨‍⚕️ Shifokor: ${data.doctorName}\n` +
                `⏰ Taxminiy vaqt: ${data.estimatedTime}\n` +
                `⏳ Kutish: ~${data.waitTime} daqiqa\n\n` +
                `Navbatingiz yaqinlashganda xabar beramiz.`;
            break;

        case 'approaching':
            message = `⚠️ *Navbatingiz yaqinlashmoqda!*\n\n` +
                `Sizdan oldin ${data.remainingPatients} ta bemor qoldi.\n` +
                `Iltimos, klinikaga yaqinlashing.`;
            break;

        case 'called':
            message = `🔔 *SIZNING NAVBATINGIZ!*\n\n` +
                `№${data.queueNumber} - Iltimos, shifokor xonasiga kiring.\n` +
                `👨‍⚕️ ${data.doctorName}\n` +
                `🚪 Xona: ${data.roomNumber || 'Qabulxona'}`;
            break;

        case 'skipped':
            message = `⏭️ *Navbatingiz o'tkazib yuborildi*\n\n` +
                `Iltimos, qabulxonaga murojaat qiling.`;
            break;

        default:
            return { success: false, error: 'Unknown notification type' };
    }

    try {
        await bot.sendMessage(chatId, message, options);
        return { success: true };
    } catch (error) {
        console.error('❌ Queue notification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send payment receipt via Telegram
 */
export const sendReceiptViaTelegram = async (orgId, chatId, pdfPath, payment) => {
    const bot = getBotForOrg(orgId);

    if (!bot) {
        console.error('❌ Bot topilmadi:', orgId);
        return { success: false, error: 'Bot not found' };
    }

    try {
        // Send message first
        await bot.sendMessage(chatId,
            `💳 *To'lov cheki*\n\n` +
            `Chek #: ${payment.receiptNumber}\n` +
            `Summa: ${payment.amount.toLocaleString('uz-UZ')} so'm\n` +
            `Sana: ${new Date(payment.createdAt).toLocaleDateString('uz-UZ')}\n\n` +
            `Chekni quyida topishingiz mumkin:`,
            { parse_mode: 'Markdown' }
        );

        // Send PDF document
        await bot.sendDocument(chatId, pdfPath, {
            caption: `To'lov cheki #${payment.receiptNumber}`
        });

        console.log(`✅ Chek yuborildi: ${payment.receiptNumber} → ${chatId}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Chek yuborishda xatolik:', error);
        return { success: false, error: error.message };
    }
};

export default {
    initTelegramBot,
    getBotForOrg,
    sendTelegramMessage,
    sendPatientNotification,
    sendQueueNotification,
    sendReceiptViaTelegram,
    reloadBots
};
