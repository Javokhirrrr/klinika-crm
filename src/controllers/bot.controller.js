import { Bot } from '../models/Bot.js';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import { reloadBots } from '../services/telegram.service.js';

/**
 * Add new bot
 */
export const addBot = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Token kiritilmagan'
            });
        }

        // Telegram API orqali bot ma'lumotlarini olish
        try {
            const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);

            if (!response.data.ok) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Token noto\'g\'ri'
                });
            }

            const botInfo = response.data.result;

            // Bot allaqachon mavjudligini tekshirish
            const existing = await Bot.findOne({ token });
            if (existing) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: 'Bu bot allaqachon qo\'shilgan'
                });
            }

            // Bot yaratish
            const bot = await Bot.create({
                orgId: req.user.orgId,
                token,
                name: botInfo.first_name,
                username: botInfo.username,
                botId: botInfo.id.toString()
            });

            // Reload bots to start this new bot
            await reloadBots();

            res.status(StatusCodes.CREATED).json({
                message: 'Bot muvaffaqiyatli qo\'shildi',
                bot: {
                    _id: bot._id,
                    name: bot.name,
                    username: bot.username,
                    isActive: bot.isActive,
                    createdAt: bot.createdAt
                }
            });
        } catch (error) {
            console.error('Telegram API error:', error);
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Token noto\'g\'ri yoki Telegram API xatolik berdi'
            });
        }
    } catch (error) {
        console.error('Add bot error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get all bots for organization
 */
export const getBots = async (req, res) => {
    try {
        const bots = await Bot.find({ orgId: req.user.orgId })
            .select('-token') // Token'ni qaytarmaymiz
            .sort({ createdAt: -1 });

        res.json({
            items: bots
        });
    } catch (error) {
        console.error('Get bots error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Delete bot
 */
export const deleteBot = async (req, res) => {
    try {
        const { id } = req.params;

        const bot = await Bot.findOne({
            _id: id,
            orgId: req.user.orgId
        });

        if (!bot) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Bot topilmadi'
            });
        }

        await bot.deleteOne();

        // Reload bots to stop this bot
        await reloadBots();

        res.json({
            message: 'Bot o\'chirildi'
        });
    } catch (error) {
        console.error('Delete bot error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get active bot for organization (for sending notifications)
 */
export const getActiveBot = async (orgId) => {
    try {
        const bot = await Bot.findOne({
            orgId,
            isActive: true
        });

        return bot;
    } catch (error) {
        console.error('Get active bot error:', error);
        return null;
    }
};
