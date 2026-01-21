import { AuditLog } from '../models/AuditLog.js';


export async function logAudit({ userId, action, entity, entityId, meta }) {
try {
await AuditLog.create({ userId, action, entity, entityId, meta });
} catch (_) {
// audit yozuvlar xatoligida API'ni to'xtatmaymiz
}
}