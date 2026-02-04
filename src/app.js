// src/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { errorHandler } from './middlewares/error.js';
import { sanitizeInput } from './middlewares/sanitize.js';
import { enhancedSecurityHeaders, corsPreflightCache } from './middlewares/securityHeaders.js';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger/openapi.cjs';

// Routers
import systemRoutes from './routes/system.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/users.routes.js';
import patientRoutes from './routes/patients.routes.js';
import serviceRoutes from './routes/services.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import orgRoutes from './routes/org.routes.js';
import doctorRoutes from "./routes/doctors.routes.js";

// NEW
import botsRoutes from "./routes/bot.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import commissionRoutes from "./routes/commission.routes.js";
import queueRoutes from "./routes/queue.routes.js";
import telegramRoutes from "./routes/telegram.routes.js";
import medicalHistoryRoutes from "./routes/medicalHistory.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// >>> MUHIM: cloudflared/ngrok ortidan IP'ni to'g'ri olish uchun
app.set('trust proxy', true);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // aktivlar TWA'da ham ochilsin
}));

// CORS
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowed = (env.corsOrigins && env.corsOrigins.length ? env.corsOrigins : DEFAULT_ORIGINS);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Parsers / logs / rate-limit / sanitization
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(sanitizeInput); // Sanitize all inputs
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// PUBLIC: Health (front hozir /system/health chaqiryapti — shuni ham qo'shamiz)
app.get('/api/system/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// API Routes
app.use('/api/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orgs', orgRoutes);
app.use("/api/doctors", doctorRoutes);

// NEW: bots and new features
app.use("/api/bots", botsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/medical-history", medicalHistoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/dashboard", dashboardRoutes);

// CORS xatosini ushlash
app.use((err, _req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }
  next(err);
});

// Global error handler
app.use(errorHandler);

export default app;
