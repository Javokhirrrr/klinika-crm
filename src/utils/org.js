// src/utils/org.js

// So‘rovga orgId qo‘shish uchun yordamchi funksiya
export function qOrg(req, more = {}) {
  const orgId = req.user?.orgId;
  if (!orgId) return { ...more };
  return { orgId, ...more };
}

// OrgId bilan update qilish uchun shart yaratish
export function qOrgUpdate(req, filter = {}) {
  const orgId = req.user?.orgId;
  if (!orgId) return { ...filter };
  return { orgId, ...filter };
}

// OrgId bilan o‘chirish uchun shart
export function qOrgDelete(req, filter = {}) {
  const orgId = req.user?.orgId;
  if (!orgId) return { ...filter };
  return { orgId, ...filter };
}

// 🔥 Yangi qo‘shiladigan funksiya (create uchun)
export function withOrgFields(req, data = {}) {
  const orgId = req.user?.orgId;
  if (!orgId) return { ...data };
  return { ...data, orgId };
}
