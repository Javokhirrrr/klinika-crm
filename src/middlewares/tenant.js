// src/middlewares/tenant.js
export function requireOrg(...args) {
  const checker = (req, res, next) => {
    // Superadmin bo'lsa, org talab qilmaymiz
    if (req.user?.role === "superadmin") return next();

    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ message: "No organization bound" });

    req.orgId = String(orgId);
    next();
  };

  // Agar noto'g'ri tarzda requireOrg() deb chaqirilsa ham, middleware qaytaramiz
  if (args.length === 0) {
    // factory uslubi: r.use(requireOrg())
    return checker;
  }

  // To'g'ri uslub: r.use(requireOrg) yoki r.get(..., requireOrg, ...)
  if (args.length === 3) {
    return checker(args[0], args[1], args[2]);
  }

  // Noaniq qo'llanishni ushlab qolish:
  throw new Error("requireOrg must be used as middleware (requireOrg or requireOrg()).");
}
