// import jwt from 'jsonwebtoken';
// import { env } from '../config/env.js';


// export function auth(req, res, next) {
// const h = req.headers.authorization || '';
// const token = h.startsWith('Bearer ') ? h.slice(7) : null;
// if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
// try {
// const payload = jwt.verify(token, env.jwtSecret);
// req.user = { id: payload.sub, email: payload.email, orgId: payload.orgId };
// req.orgId = payload.orgId;
// next();
// } catch (e) {
// return res.status(401).json({ ok: false, message: 'Invalid token' });
// }
// }


// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Authenticate middleware
 * Tekshiradi, token mavjud va to'g'ri ekanligini
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    console.error('❌ Authentication failed: No token provided');
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const userId = payload.sub || payload.uid; // Support both old and new tokens
    req.user = {
      _id: userId,
      id: userId,
      email: payload.email,
      orgId: payload.orgId,
      role: payload.role || 'admin',  // Add role from token
    };
    req.orgId = payload.orgId;
    next();
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    console.error('Token:', token.substring(0, 20) + '...');
    return res.status(401).json({ ok: false, message: 'Invalid token', error: err.message });
  }
}

/**
 * Authorize middleware
 * Tekshiradi, foydalanuvchi ma'lum rollarga ega ekanligini
 */
export function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }

    // Agar roles bo'sh bo'lsa, har kimga ruxsat
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    next();
  };
}
