// src/routes/auth.routes.js
import { Router } from 'express';
import {
  registerSelf,
  login,
  refresh,
  me,
  logout,
} from '../controllers/auth.controller.js';
import {
  forgotPassword,
  resetPassword,
} from '../controllers/password.controller.js';
import {
  authLimiter,
  registerLimiter,
  passwordResetLimiter
} from '../middlewares/advancedRateLimit.js';

const r = Router();

// Self / onboarding
r.post('/register-self', registerSelf);
r.post('/self-register', registerSelf);

// Auth
r.post('/login', login);
r.post('/refresh', refresh);
r.get('/me', me);
r.post('/logout', logout);

// Password reset
r.post('/forgot-password', forgotPassword);
r.post('/reset-password', resetPassword);

export default r;
