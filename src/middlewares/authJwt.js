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
      console.log('❌ Authentication failed: No token provided');
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
    const isExpired = e.name === 'TokenExpiredError' || e.message === 'jwt expired';
    if (isExpired) {
      console.warn('⚠️ Authentication: JWT expired');
    } else {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.cookies?.access_token || '');
      console.log(`❌ Authentication failed: ${e.message}`);
      console.log(`Token: ${token.slice(0, 20)}...`);
    }

    return res.status(401).json({
      message: e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid or expired token',
      error: e.message
    });
  }
}
