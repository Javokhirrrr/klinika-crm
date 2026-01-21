export function requireOrg(req, res, next) {
    const orgId = req.user?.orgId;

    if (!orgId) {
        return res.status(401).json({ message: 'Organization not selected' });
    }

    req.orgId = orgId;
    next();
}
