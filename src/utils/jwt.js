// src/utils/jwt.js
import jwt from 'jsonwebtoken';

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (check your .env)`);
  return v;
}

export function signAccess(payload, opts = {}) {
  return jwt.sign(payload, need('JWT_ACCESS_SECRET'), { expiresIn: '8h', ...opts });
}

export function signRefresh(payload, opts = {}) {
  return jwt.sign(payload, need('JWT_REFRESH_SECRET'), { expiresIn: '30d', ...opts });
}

export function verifyAccess(token, opts = {}) {
  return jwt.verify(token, need('JWT_ACCESS_SECRET'), opts);
}

export function verifyRefresh(token, opts = {}) {
  return jwt.verify(token, need('JWT_REFRESH_SECRET'), opts);
}
