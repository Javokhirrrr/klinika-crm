import crypto from 'crypto';
import { Patient } from '../models/Patient.js';
import { Bot } from '../models/Bot.js';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Validate Telegram Web App initData
 */
function validateTelegramWebAppData(initData, botToken) {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Sort parameters
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Create secret key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Calculate hash
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
}

/**
 * Authenticate Web App user
 */
export const authenticateWebApp = async (req, res) => {
    try {
        const { initData } = req.body;

        if (!initData) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'initData kiritilmagan'
            });
        }

        // Parse initData
        const urlParams = new URLSearchParams(initData);
        const userJson = urlParams.get('user');

        if (!userJson) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'User ma\'lumoti topilmadi'
            });
        }

        const user = JSON.parse(userJson);
        const telegramUserId = user.id.toString();

        // Find patient by telegram chat ID
        const patient = await Patient.findOne({
            telegramChatId: telegramUserId
        }).populate('orgId');

        if (!patient) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Bemor topilmadi. Avval bot orqali ro\'yxatdan o\'ting.'
            });
        }

        // Get bot for validation
        const bot = await Bot.findOne({
            orgId: patient.orgId,
            isActive: true
        });

        if (!bot) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Bot topilmadi'
            });
        }

        // Validate initData
        const isValid = validateTelegramWebAppData(initData, bot.token);

        if (!isValid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Noto\'g\'ri autentifikatsiya'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                _id: patient._id,
                orgId: patient.orgId,
                role: 'patient'
            },
            env.jwtAccessSecret,
            { expiresIn: '7d' }
        );

        // Return token and patient data
        res.json({
            token,
            patient: {
                _id: patient._id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                phone: patient.phone,
                email: patient.email,
                dob: patient.dob,
                gender: patient.gender
            }
        });
    } catch (error) {
        console.error('Web App auth error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my queue (for Web App)
 */
export const getMyQueue = async (req, res) => {
    try {
        const patientId = req.user._id;

        const QueueEntry = (await import('../models/QueueEntry.js')).QueueEntry;

        const queueEntry = await QueueEntry.findOne({
            patientId,
            status: { $in: ['waiting', 'called', 'in_service'] }
        })
            .populate('doctorId', 'firstName lastName')
            .sort({ joinedAt: -1 });

        if (!queueEntry) {
            return res.json({ queue: null });
        }

        // Calculate estimated time and wait time
        const avgServiceTime = 20; // minutes
        const position = await QueueEntry.countDocuments({
            doctorId: queueEntry.doctorId,
            status: 'waiting',
            joinedAt: { $lt: queueEntry.joinedAt }
        });

        const waitTime = position * avgServiceTime;
        const estimatedTime = new Date(Date.now() + waitTime * 60000)
            .toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

        res.json({
            queue: {
                queueNumber: queueEntry.queueNumber,
                status: queueEntry.status,
                priority: queueEntry.priority
            },
            doctor: {
                name: `${queueEntry.doctorId.firstName} ${queueEntry.doctorId.lastName}`
            },
            estimatedTime,
            waitTime
        });
    } catch (error) {
        console.error('Get my queue error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my payments (for Web App)
 */
export const getMyPayments = async (req, res) => {
    try {
        const patientId = req.user._id;

        const Payment = (await import('../models/Payment.js')).Payment;

        const payments = await Payment.find({ patientId })
            .populate('serviceId', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        const formattedPayments = payments.map(p => ({
            _id: p._id,
            amount: p.amount,
            date: p.createdAt,
            service: p.serviceId?.name || 'Xizmat',
            status: p.status || 'paid'
        }));

        res.json({ payments: formattedPayments });
    } catch (error) {
        console.error('Get my payments error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};

/**
 * Get my medical history (for Web App)
 */
export const getMyHistory = async (req, res) => {
    try {
        const patientId = req.user._id;

        const MedicalHistory = (await import('../models/MedicalHistory.js')).MedicalHistory;

        const history = await MedicalHistory.find({ patientId })
            .populate('doctorId', 'firstName lastName spec')
            .sort({ date: -1 })
            .limit(20)
            .select('-orgId -__v');

        const formattedHistory = history.map(h => ({
            _id: h._id,
            date: h.date,
            type: h.type,
            title: h.title,
            description: h.description,
            doctor: h.doctorId ? {
                name: `${h.doctorId.firstName} ${h.doctorId.lastName}`,
                spec: h.doctorId.spec
            } : null,
            medications: h.medications,
            labResults: h.labResults,
            vitalSigns: h.vitalSigns,
            attachments: h.attachments
        }));

        res.json({ history: formattedHistory });
    } catch (error) {
        console.error('Get my history error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Xatolik yuz berdi',
            error: error.message
        });
    }
};
