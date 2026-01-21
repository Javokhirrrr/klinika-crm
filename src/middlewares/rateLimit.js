// src/middlewares/rateLimit.js
import rateLimit from 'express-rate-limit';

/**
 * Cloudflared/ngrok ortidan kelayotgan so'rovlar uchun:
 * - app.set('trust proxy', true) ni qo'ydik (app.js)
 * - shu sababli x-forwarded-for headeri endi normal ishlaydi
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // ishonchli bo‘lsa ham, kalit sifatida req.ip dan foydalanamiz
  keyGenerator: (req) => req.ip,
});
