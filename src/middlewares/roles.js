// src/middlewares/roles.js
const OWNER_ALIASES = new Set([
  "owner", "accountowner", "account_owner",
  "orgowner", "org_owner", "tenantowner", "tenant_owner",
  "account-owner"
]);

const SUPER_ALIASES = new Set([
  "superadmin", "super_admin", "platformadmin", "platform_admin", "root"
]);

function norm(v) { return String(v || "").toLowerCase(); }
function isOwnerish(v) { return OWNER_ALIASES.has(norm(v)); }
function isSuperish(v) { return SUPER_ALIASES.has(norm(v)); }

export function requireRoles(...roles) {
  const allowed = roles.map(norm);

  return (req, res, next) => {
    const role     = norm(req.user?.role || req.auth?.role);
    const gRole    = norm(req.auth?.globalRole);
    const orgRole  = norm(req.auth?.orgRole || req.auth?.organizationRole || req.auth?.tenantRole);
    const isOwnerF = !!req.auth?.isOwner;
    const isSuperF = !!req.auth?.isSuperAdmin;

    if (!role && !gRole && !orgRole && !isOwnerF && !isSuperF) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // superadmin/owner har doim o'tadi
    if (isSuperF || isSuperish(role) || isSuperish(gRole) || isSuperish(orgRole)) return next();
    if (isOwnerF || isOwnerish(role) || isOwnerish(gRole) || isOwnerish(orgRole)) return next();

    if (!allowed.includes(role)) {
      return res.status(403).json({ message: `Forbidden: requires one of [${allowed.join(", ")}]` });
    }
    next();
  };
}
