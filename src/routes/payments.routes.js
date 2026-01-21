import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';
import * as ctrl from '../controllers/payments.controller.js';

const r = Router();
r.use(authJwt, requireOrg); // 🔐 JWT + orgId

const CAN_CREATE = ['owner', 'admin', 'accountant', 'reception', 'receptionist', 'cashier'];
const CAN_READ = [...CAN_CREATE, 'doctor'];

const allow = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
  next();
};

r.get('/', allow(CAN_READ), ctrl.listPayments);
r.post('/', allow(CAN_CREATE), ctrl.createPayment);

r.get('/patients/:id', allow(CAN_READ), ctrl.listPatientPayments);
r.get('/invoices/:id/pdf', allow(CAN_CREATE), ctrl.invoicePdf);

const REPORT_ROLES = ['owner', 'admin', 'accountant'];

r.get('/reports/revenue', allow(REPORT_ROLES), ctrl.reportRevenue);
r.get('/reports/top-services', allow(REPORT_ROLES), ctrl.reportTopServices);
r.get('/reports/outstanding-debts', allow(REPORT_ROLES), ctrl.reportOutstandingDebts);
r.get('/patients/:id/balance', allow(CAN_READ), ctrl.patientBalance);

export default r;
