import { verifyAccess } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')
    ? auth.slice(7)
    : req.cookies?.access_token; // httpOnly cookie nomi

  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = verifyAccess(token); // { sub, org, role, iat, exp }
    req.auth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid/expired token' });
  }
}
