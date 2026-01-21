import { verifyAccess } from '../utils/jwt.js';

export function authJwt(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    let token = null;

    if (auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No access token' });
    }

    const payload = verifyAccess(token);

    // 🔥 MUHIM: req.user set qilinyapti
    req.user = {
      id: payload.uid,
      role: payload.role,
      email: payload.email,
      orgId: payload.orgId,
      globalRole: payload.globalRole,
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
