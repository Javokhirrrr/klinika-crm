import { User } from '../models/User.js';
import { PasswordReset } from '../models/PasswordReset.js';
import { hashPassword } from '../utils/passwords.js';
import Joi from 'joi';
import crypto from 'crypto';


const forgotSchema = Joi.object({ email: Joi.string().email().required() });
const resetSchema = Joi.object({ token: Joi.string().required(), newPassword: Joi.string().min(6).max(100).required() });


export async function forgotPassword(req, res) {
const { value, error } = forgotSchema.validate(req.body);
if (error) return res.status(400).json({ message: error.message });


const user = await User.findOne({ email: value.email });
if (!user) return res.json({ ok: true }); // email leakage oldini olish uchun har doim ok


const token = crypto.randomBytes(24).toString('hex');
const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30m
await PasswordReset.create({ userId: user._id, token, expiresAt });


// Reset linkni hozircha log/Telegram orqali yuboramiz
const link = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;
console.log('Password reset link:', link);
res.json({ ok: true });
}


export async function resetPassword(req, res) {
const { value, error } = resetSchema.validate(req.body);
if (error) return res.status(400).json({ message: error.message });


const pr = await PasswordReset.findOne({ token: value.token, used: false });
if (!pr || pr.expiresAt < new Date()) return res.status(400).json({ message: 'Invalid or expired token' });


const user = await User.findById(pr.userId);
if (!user) return res.status(400).json({ message: 'Invalid token' });


user.passwordHash = await hashPassword(value.newPassword);
await user.save();
pr.used = true; await pr.save();


res.json({ ok: true });
}