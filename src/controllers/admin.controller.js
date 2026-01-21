import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';

export async function overview(req, res) {
  const [orgs, activeOrgs, users] = await Promise.all([
    Organization.countDocuments({}),
    Organization.countDocuments({ isActive: true }),
    User.countDocuments({}),
  ]);
  res.json({ orgs, activeOrgs, users });
}
