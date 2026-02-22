// telegram.service.js Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљ v3 Р В Р вЂ Р В РІР‚С™Р Р†Р вЂљРЎСљ 2026-02-22
import TelegramBot from 'node-telegram-bot-api';
import { Bot } from '../models/Bot.js';
import { Patient } from '../models/Patient.js';
import { env } from '../config/env.js';

const bots = new Map();

export const initTelegramBot = async () => {
    try {
        const activeBots = await Bot.find({ isActive: true });
        if (activeBots.length === 0) {
            console.log('No active bots found');
            return;
        }
        for (const botConfig of activeBots) {
            try { await initializeSingleBot(botConfig); }
            catch (error) { console.error('Bot init error:', error.message); }
        }
    } catch (error) {
        console.error('Telegram init error:', error);
    }
};

async function initializeSingleBot(botConfig) {
    const { orgId, token, name } = botConfig;
    const bot = new TelegramBot(token, { polling: true });
    bots.set(orgId.toString(), bot);
    console.log('Bot started:', name);
    setupBotCommands(bot, orgId);
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error.message);
    });
}

function setupBotCommands(bot, orgId) {
    // /start
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
            if (patient) {
                await sendMainMenu(bot, chatId, patient);
            } else {
                await bot.sendMessage(chatId,
                    '\u{1F3E5} Klinika CRM botiga xush kelibsiz!\n\nTelefon raqamingizni yuboring:',
                    {
                        reply_markup: {
                            keyboard: [[{ text: '\u{1F4F1} Telefon raqamni yuborish', request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Start error:', error);
            await bot.sendMessage(chatId, 'Xatolik yuz berdi.');
        }
    });

    // /karta yoki /profil
    bot.onText(/\/(karta|profil|card|profile)/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
            if (!patient) return bot.sendMessage(chatId, "Siz ro'yxatdan o'tmagansiz. /start bosing.");
            await sendPatientCard(bot, chatId, patient);
        } catch (e) { console.error('/karta error:', e); }
    });

    // /help
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId,
            '\u{1F4DA} Yordam\n\n/start - Boshlash\n/karta - Bemor kartangiz\n/help - Yordam'
        );
    });

    // kontakt (telefon)
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const phoneNumber = msg.contact.phone_number;
        try {
            let phone = phoneNumber.replace(/\D/g, '');
            if (phone.startsWith('998')) phone = '+' + phone;
            else if (!phone.startsWith('+')) phone = '+998' + phone;

            const patient = await Patient.findOne({
                orgId,
                phone: { $regex: phone.slice(-9), $options: 'i' }
            });

            if (patient) {
                patient.telegramChatId = chatId.toString();
                patient.telegramUsername = msg.from.username || null;
                patient.telegramVerified = true;
                patient.telegramVerifiedAt = new Date();
                await patient.save();

                await bot.sendMessage(chatId,
                    '\u2705 Tasdiqlandi!\n\nSalom, ' + patient.firstName + ' ' + (patient.lastName || '') + '!',
                    { reply_markup: { remove_keyboard: true } }
                );
                await sendMainMenu(bot, chatId, patient);
            } else {
                await bot.sendMessage(chatId,
                    '\u274C Bu raqam bazada topilmadi.\nKlinikaga murojaat qiling.',
                    { reply_markup: { remove_keyboard: true } }
                );
            }
        } catch (error) {
            console.error('Contact error:', error);
            await bot.sendMessage(chatId, 'Xatolik yuz berdi.');
        }
    });

    // callback query
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;
        try {
            await bot.answerCallbackQuery(query.id);
            switch (data) {
                case 'my_card': {
                    const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
                    if (patient) await sendPatientCard(bot, chatId, patient);
                    else await bot.sendMessage(chatId, 'Bemor topilmadi. /start bosing.');
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
                    await bot.sendMessage(chatId, '/karta - bemor kartangiz\n/start - boshlash');
                    break;
                default:
                    await bot.sendMessage(chatId, "Noma'lum buyruq");
            }
        } catch (error) {
            console.error('Callback error:', error);
            await bot.sendMessage(chatId, 'Xatolik yuz berdi');
        }
    });
}

// Asosiy menyu
async function sendMainMenu(bot, chatId, patient) {
    const name = (patient?.firstName || 'Bemor');
    await bot.sendMessage(chatId,
        '\u{1F3E5} Asosiy Menyu\n\nSalom, ' + name + '!\nQuyidagilardan birini tanlang:',
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '\u{1F194} Bemor Kartam', callback_data: 'my_card' }],
                    [
                        { text: '\u{1F3AB} Navbatim', callback_data: 'queue' },
                        { text: '\u{1F4B3} To\'lovlar', callback_data: 'payments' }
                    ],
                    [
                        { text: '\u{1F4CB} Kasallik tarixi', callback_data: 'history' },
                        { text: '\u{1F4C5} Qabullar', callback_data: 'appointments' }
                    ],
                    [
                        { text: '\u2699\uFE0F Sozlamalar', callback_data: 'settings' },
                        { text: '\u2753 Yordam', callback_data: 'help' }
                    ]
                ]
            }
        }
    );
}

// Bemor kartasi РІР‚вЂќ barcode rasm + bemor ma'lumotlari
async function sendPatientCard(bot, chatId, patient) {
    try {
        const cardNo = String(patient.cardNo || patient.cardNumber || patient._id || '00000000').replace(/\D/g, '') || '00000000';
        const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || "Noma'lum";
        const phone = patient.phone || '\u2014';
        const gender = patient.gender === 'male' ? 'Erkak' : patient.gender === 'female' ? 'Ayol' : '\u2014';

        let ageStr = '';
        if (patient.birthDate) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            ageStr = age + ' yosh';
        }

        const regDate = patient.createdAt
            ? new Date(patient.createdAt).toLocaleDateString('uz-UZ') : '';

        // Caption matni
        const caption = [
            '\ud83c\udfe5 <b>BEMOR KARTASI</b>',
            '<i>Klinika CRM Tizimi</i>',
            '',
            '\ud83d\udc64 <b>' + fullName + '</b>',
            '\ud83c\udff7 Karta: <code>' + cardNo + '</code>',
            '\ud83d\udcde Tel: <code>' + phone + '</code>',
            ageStr ? '\ud83c\udf82 Yosh: ' + ageStr : '',
            '\u2642\ufe0f Jins: ' + gender,
            regDate ? '\ud83d\udcc5 Ro\'yxat: ' + regDate : '',
            '',
            '<i>Har safar klinikaga kelganingizda</i>',
            '<i>ushbu kartani ko\'rsating!</i>',
        ].filter(Boolean).join('\n');

        // barcodeapi.org dan barcode rasmi
        const barcodeUrl = 'https://barcodeapi.org/api/code128/' + cardNo + '?width=2&height=60';

        const markup = {
            inline_keyboard: [
                [
                    { text: '\ud83d\udcc5 Qabullarim', callback_data: 'appointments' },
                    { text: '\ud83d\udd04 Yangilash', callback_data: 'my_card' }
                ],
                [{ text: '\ud83c\udfe0 Bosh menyu', callback_data: 'back_menu' }]
            ]
        };

        await bot.sendPhoto(chatId, barcodeUrl, {
            caption,
            parse_mode: 'HTML',
            reply_markup: markup,
        });
    } catch (err) {
        console.error('sendPatientCard error:', err);
        // Barcode yuklanmasa РІР‚вЂќ oddiy xabar
        try {
            await bot.sendMessage(chatId,
                '\ud83c\udfe5 <b>BEMOR KARTASI</b>\n\n' +
                '\ud83d\udc64 ' + [patient.firstName, patient.lastName].filter(Boolean).join(' ') + '\n' +
                (patient.phone ? '\ud83d\udcde ' + patient.phone + '\n' : '') +
                (patient.cardNo ? '\ud83c\udff7 ' + patient.cardNo : ''),
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '\ud83d\udd04 Yangilash', callback_data: 'my_card' }],
                            [{ text: '\ud83c\udfe0 Bosh menyu', callback_data: 'back_menu' }],
                        ]
                    }
                }
            );
        } catch (_) { }
    }
}


async function handleMyQueue(bot, chatId, orgId) {
    try {
        const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
        if (!patient) return bot.sendMessage(chatId, 'Bemor topilmadi');
        await bot.sendMessage(chatId, '\u{1F3AB} Navbatim\n\nHozirda navbatda yo\'qsiz.\nQabul uchun klinikaga murojaat qiling.');
    } catch (error) {
        console.error('Queue error:', error);
        await bot.sendMessage(chatId, 'Xatolik yuz berdi');
    }
}

async function handleMyPayments(bot, chatId, orgId) {
    try {
        await bot.sendMessage(chatId, "\u{1F4B3} To'lovlarim\n\nTo'lovlar tarixi hali mavjud emas.");
    } catch (error) {
        console.error('Payments error:', error);
        await bot.sendMessage(chatId, 'Xatolik yuz berdi');
    }
}

async function handleMyHistory(bot, chatId, orgId) {
    try {
        const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
        if (!patient) return bot.sendMessage(chatId, 'Bemor topilmadi');
        const { MedicalHistory } = await import('../models/MedicalHistory.js');
        const history = await MedicalHistory.find({ orgId, patientId: patient._id })
            .sort({ date: -1 }).limit(5)
            .populate('doctorId', 'firstName lastName spec');
        if (!history.length) {
            return bot.sendMessage(chatId, "\u{1F4CB} Kasallik tarixim\n\nHozircha kasallik tarixi yo'q.");
        }
        let msg = '\u{1F4CB} Kasallik tarixim\n\n';
        history.forEach((entry, i) => {
            const date = new Date(entry.date).toLocaleDateString('uz-UZ');
            const doctor = entry.doctorId ? `${entry.doctorId.firstName} ${entry.doctorId.lastName}` : 'Noma\'lum';
            msg += `${i + 1}. ${entry.title}\n\u{1F4C5} ${date}\n\u{1F468}\u200D\u2695\uFE0F ${doctor}\n\n`;
        });
        await bot.sendMessage(chatId, msg);
    } catch (error) {
        console.error('History error:', error);
        await bot.sendMessage(chatId, 'Xatolik yuz berdi');
    }
}

async function handleMyAppointments(bot, chatId, orgId) {
    try {
        const patient = await Patient.findOne({ orgId, telegramChatId: chatId.toString() });
        if (!patient) return bot.sendMessage(chatId, 'Bemor topilmadi');
        const { Appointment } = await import('../models/Appointment.js');
        const apts = await Appointment.find({
            orgId,
            patientId: patient._id,
            isDeleted: { $ne: true },
        }).sort({ startAt: -1 }).limit(5).populate('doctorId', 'firstName lastName');
        if (!apts.length) return bot.sendMessage(chatId, "\u{1F4C5} Qabullar\n\nQabullar mavjud emas.");
        let msg = '\u{1F4C5} Qabullarim:\n\n';
        apts.forEach((a, i) => {
            const dt = a.startAt ? new Date(a.startAt).toLocaleString('uz-UZ') : a.date || '-';
            const doc = a.doctorId ? `Dr. ${a.doctorId.firstName} ${a.doctorId.lastName || ''}` : '-';
            msg += `${i + 1}. ${dt}\n\u{1F468}\u200D\u2695\uFE0F ${doc}\n\n`;
        });
        await bot.sendMessage(chatId, msg);
    } catch (error) {
        console.error('Appointments error:', error);
        await bot.sendMessage(chatId, 'Xatolik yuz berdi');
    }
}

async function handleSettings(bot, chatId) {
    await bot.sendMessage(chatId, "\u2699\uFE0F Sozlamalar ishlab chiqilmoqda...");
}

export const getBotForOrg = (orgId) => bots.get(orgId.toString());

export const sendTelegramMessage = async (orgId, chatId, message, options = {}) => {
    const bot = getBotForOrg(orgId);
    if (!bot) return { success: false, error: 'Bot not found' };
    try {
        await bot.sendMessage(chatId, message, options);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const sendPatientNotification = async (patientId, message, options = {}) => {
    try {
        const patient = await Patient.findById(patientId);
        if (!patient || !patient.telegramChatId) return { success: false, message: 'Not connected' };
        return await sendTelegramMessage(patient.orgId, patient.telegramChatId, message, options);
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const reloadBots = async () => {
    for (const [orgId, bot] of bots.entries()) {
        try { await bot.stopPolling(); } catch (e) { }
    }
    bots.clear();
    await initTelegramBot();
};

export const sendQueueNotification = async (orgId, chatId, data) => {
    const bot = getBotForOrg(orgId);
    if (!bot) return { success: false, error: 'Bot not found' };
    let message = '';
    switch (data.type) {
        case 'added':
            message = `\u{1F3AB} Navbatga qo'shildingiz!\n\nNavbat: \u2116${data.queueNumber}\nShifokor: ${data.doctorName}\nKutish: ~${data.waitTime} daqiqa`;
            break;
        case 'called':
            message = `\u{1F514} SIZNING NAVBATINGIZ!\n\n\u2116${data.queueNumber} - Shifokor xonasiga kiring.`;
            break;
        default:
            return { success: false, error: 'Unknown type' };
    }
    try {
        await bot.sendMessage(chatId, message);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const sendReceiptViaTelegram = async (orgId, chatId, pdfPath, payment) => {
    const bot = getBotForOrg(orgId);
    if (!bot) return { success: false, error: 'Bot not found' };
    try {
        await bot.sendMessage(chatId,
            `\u{1F4B3} To'lov cheki\n\nChek: ${payment.receiptNumber}\nSumma: ${payment.amount.toLocaleString()} so'm\nSana: ${new Date(payment.createdAt).toLocaleDateString('uz-UZ')}`
        );
        await bot.sendDocument(chatId, pdfPath, { caption: `To'lov cheki #${payment.receiptNumber}` });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export default {
    initTelegramBot, getBotForOrg, sendTelegramMessage,
    sendPatientNotification, sendQueueNotification,
    sendReceiptViaTelegram, reloadBots
};
