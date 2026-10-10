import { nowISO, randomId } from '../ids'
import type { AdminAuditLog } from '../types'

// کنترل دسترسی مدیران. در تولید باید سمت سرور اعمال شود؛ بررسی سمت کلاینت فقط برای نمایش رابط است و امنیت محسوب نمی‌شود.
export type AdminRole = 'super_admin' | 'analyst' | 'support' | 'marketing'
export type Permission = 'users.view' | 'users.view_contact' | 'users.export' | 'users.disable' | 'users.delete' | 'audience.preview' | 'audience.send'
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['users.view', 'users.view_contact', 'users.export', 'users.disable', 'users.delete', 'audience.preview'],
  support: ['users.view', 'users.view_contact', 'users.disable'],
  analyst: ['users.view', 'audience.preview'],
  marketing: ['audience.preview'],
}
// 'audience.send' به هیچ نقشی داده نشده: ارسال واقعی تا اتصال سرویس معتبر و کنترل‌های رضایت غیرفعال است.
export const can = (role: AdminRole | null | undefined, p: Permission) => !!role && ROLE_PERMISSIONS[role].includes(p)
export class ForbiddenError extends Error { constructor(public permission: Permission) { super('FORBIDDEN:' + permission) } }
export function assertCan(role: AdminRole | null | undefined, p: Permission) { if (!can(role, p)) throw new ForbiddenError(p) }

export function auditEntry(adminId: string, role: AdminRole, action: AdminAuditLog['action'], targetId?: string, now = new Date()): AdminAuditLog {
  return { audit_id: randomId('a'), admin_id: adminId, role, action, ...(targetId ? { target_id: targetId } : {}), occurred_at: nowISO(now) } // بدون هیچ دادهٔ حساس
}
