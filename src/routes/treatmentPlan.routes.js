import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt.js';
import { requireOrg } from '../middlewares/tenant.js';
import * as ctrl from '../controllers/treatmentPlan.controller.js';

const r = Router();
r.use(authJwt, requireOrg);

const ALLOWED = ['owner', 'admin', 'doctor', 'reception'];

const allow = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

r.get('/',                                allow(ALLOWED), ctrl.listPlans);
r.get('/:id',                             allow(ALLOWED), ctrl.getPlan);
r.post('/',                               allow(ALLOWED), ctrl.createPlan);
r.put('/:id',                             allow(ALLOWED), ctrl.updatePlan);
r.patch('/:id/items/:itemId/status',      allow(ALLOWED), ctrl.updateItemStatus);
r.delete('/:id',                          allow(['owner', 'admin']), ctrl.deletePlan);

export default r;
