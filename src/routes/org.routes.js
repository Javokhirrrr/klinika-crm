// src/routes/org.routes.js
import { Router } from 'express';
import { Organization } from '../models/Organization.js';

const r = Router();

/** GET /api/orgs/by-code/:code  ->  { org: { id, name, code } } */
r.get('/by-code/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) return res.status(400).json({ message: 'Code is required' });

  const org = await Organization.findOne({ code }).lean();
  if (!org) return res.status(404).json({ message: 'Organization not found' });

  return res.json({ org: { id: org._id, name: org.name, code: org.code } });
});

export default r;
