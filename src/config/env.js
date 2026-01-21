// src/config/env.js
import 'dotenv/config';

function required(name, fallback) {
    const v = process.env[name] ?? fallback;
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function trimSlash(s = '') {
    return String(s).replace(/\/+$/, '');
}

const PORT = Number(process.env.PORT ?? 5000);
const LOCAL_BASE = `http://localhost:${PORT}`;

const PUBLIC_BASE =
    process.env.PUBLIC_URL ||
    process.env.PUBLIC_BASE_URL ||
    LOCAL_BASE;

const WEBAPP_BASE =
    process.env.WEBAPP_URL ||
    `${trimSlash(PUBLIC_BASE)}/twa`;

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: PORT,

    mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/klinika_crm'),
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    corsOrigins: (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '*')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),

    jwtAccessSecret: required('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '30m',
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '30d',

    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        cashierChatId: process.env.TELEGRAM_CASHIER_CHAT_ID,
    },

    // Alias for easier access
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,

    publicUrl: trimSlash(PUBLIC_BASE),
    webappUrl: trimSlash(WEBAPP_BASE),

    orgCodeBase: Number(process.env.ORG_CODE_BASE ?? 150000),
};
