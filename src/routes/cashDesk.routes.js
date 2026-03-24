import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';
import * as ctrl from '../controllers/cashDesk.controller.js';

const r = Router();
r.use(authJwt, requireOrg); // 🔐 JWT + orgId

const ALLOWED = ['owner', 'admin', 'accountant', 'cashier'];
const ALL_STAFF = ['owner', 'admin', 'accountant', 'cashier', 'doctor', 'reception'];

const allow = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
  next();
};

// ─── Kassalar ─────────────────────────────────────────────────────────────────
r.get('/',      allow(ALL_STAFF), ctrl.listDesks);
r.post('/',     allow(['owner', 'admin', 'accountant']), ctrl.createDesk);
r.put('/:id',   allow(['owner', 'admin', 'accountant']), ctrl.updateDesk);
r.delete('/:id',allow(['owner', 'admin']), ctrl.deleteDesk);

// ─── Tranzaksiyalar ───────────────────────────────────────────────────────────
r.get('/transactions',  allow(ALLOWED), ctrl.listTransactions);
r.post('/transactions', allow(ALLOWED), ctrl.createTransaction);

// ─── Statistika ───────────────────────────────────────────────────────────────
r.get('/stats', allow(ALLOWED), ctrl.getStats);

export default r;
