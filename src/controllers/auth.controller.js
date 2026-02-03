import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../utils/jwt.js';
import { nextOrgCode } from '../utils/orgCode.js';

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookies(res, { accessToken, refreshToken }) {
  if (accessToken) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });
  }
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

function safeUser(u) {
  if (!u) return null;
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    orgId: u.orgId,
    role: u.role,
    globalRole: u.globalRole || 'tenant_user',
  };
}

function getAccessTokenFromReq(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.cookies?.access_token || null;
}
function getRefreshTokenFromReq(req) {
  return req.body?.refreshToken || req.cookies?.refresh_token || null;
}

/* ===== Joi Schemas ===== */
const selfRegisterSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  clinicName: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirm: Joi.any().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().min(7),
  password: Joi.string().min(3).required(),
}).xor('email', 'phone');

/* ===== Controllers ===== */
export async function registerSelf(req, res) {
  try {
    const { value, error } = selfRegisterSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const email = value.email.toLowerCase().trim();
    const exists = await User.findOne({ email, isDeleted: { $ne: true } }).lean();
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    // Org + ketma-ket kod
    const code = await nextOrgCode(); // masalan: "150001"
    const org = await Organization.create({ name: value.clinicName, code });

    const passwordHash = await bcrypt.hash(String(value.password), 10);
    const user = await User.create({
      name: value.name.trim(),
      email,
      role: 'owner',
      globalRole: 'tenant_user',
      orgId: org._id,
      passwordHash,
      isActive: true,
      isDeleted: false,
    });

    const payload = {
      sub: String(user._id),
      uid: String(user._id),
      role: user.role,
      email: user.email,
      orgId: String(org._id),
      globalRole: 'tenant_user',
    };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: safeUser(user),
      org: { id: org._id, name: org.name, code: org.code },
    });
  } catch (e) {
    console.error('registerSelf error:', e);
    return res.status(500).json({ message: 'Internal error' });
  }
}

export async function login(req, res) {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const query = { isDeleted: { $ne: true } };
    if (value.email) query.email = value.email.toLowerCase().trim();
    if (value.phone) query.phone = value.phone.trim();

    const user = await User.findOne(query).lean();
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isActive === false) return res.status(403).json({ message: 'User is inactive' });

    const ok = await bcrypt.compare(value.password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = {
      sub: String(user._id),
      uid: String(user._id),
      role: user.role,
      email: user.email,
      orgId: user.orgId ? String(user.orgId) : undefined,
      globalRole: user.globalRole || 'tenant_user',
    };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    setAuthCookies(res, { accessToken, refreshToken });

    let org = null;
    if (user.orgId) {
      const o = await Organization.findById(user.orgId).lean();
      if (o) org = { id: o._id, name: o.name, code: o.code };
    }

    return res.json({
      accessToken,
      refreshToken,
      user: safeUser(user),
      org,
    });
  } catch (e) {
    console.error('login error:', e);
    return res.status(500).json({ message: 'Internal error' });
  }
}

export async function refresh(req, res) {
  try {
    const token = getRefreshTokenFromReq(req);
    if (!token) return res.status(400).json({ message: 'No refresh token' });

    const r = verifyRefresh(token);
    const accessToken = signAccess({
      sub: r.uid || r.sub,
      uid: r.uid || r.sub,
      role: r.role,
      email: r.email,
      orgId: r.orgId,
      globalRole: r.globalRole,
    });

    setAuthCookies(res, { accessToken, refreshToken: null });
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function me(req, res) {
  try {
    const token = getAccessTokenFromReq(req);
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = verifyAccess(token);
    const user = await User.findById(payload.uid).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    let org = null;
    if (user.orgId) {
      const o = await Organization.findById(user.orgId).lean();
      if (o) org = { id: o._id, name: o.name, code: o.code };
    }

    return res.json({ user: safeUser(user), org });
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}

export async function logout(_req, res) {
  try {
    clearAuthCookies(res);
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
}
