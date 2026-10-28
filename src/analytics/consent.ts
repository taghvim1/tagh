import { nowISO, randomId, type KV } from './ids'
import type { ConsentKind, ConsentRecord, ConsentSummary } from './types'

// تصمیم محصول: تحلیل ناشناس و تبلیغات شخصی‌سازی‌شده به‌طور پیش‌فرض فعال‌اند (بدون پنجرهٔ رضایت) و پیش‌فرضشان با نسخهٔ سیاست و زمان ثبت می‌شود (source: 'default').
// اعلان و موقعیت «رضایت مبتنی بر مجوز»اند: وقتی مرورگر/سیستم‌عامل مجوز را داده باشد فعال محسوب می‌شوند و در غیر این صورت غیرفعال (source: 'permission').
// پیش‌فرضِ روشن برای این دو نوع وجود ندارد، چون برای کاربری که مجوز نداده رضایت نادرست ثبت می‌کرد.
export const POLICY_VERSION = '2026-10-v5'
export const PERMISSION_KINDS: ConsentKind[] = ['notifications', 'location']
const isPermissionKind = (k: ConsentKind) => PERMISSION_KINDS.includes(k)
export const CONSENT_KINDS: ConsentKind[] = ['analytics', 'marketing', 'notifications', 'location']
export const DEFAULT_CONSENT: ConsentSummary = { analytics: true, marketing: true, notifications: false, location: false }
export const NO_CONSENT: ConsentSummary = { analytics: false, marketing: false, notifications: false, location: false }
const KEY = 'taghvim-consent-v1'

export function loadConsentRecords(kv: KV): ConsentRecord[] {
  try { const v = JSON.parse(kv.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function consentSummary(records: ConsentRecord[]): ConsentSummary {
  const s = { ...DEFAULT_CONSENT }
  for (const r of records) {
    // برای اعلان/موقعیت فقط رکوردهای مبتنی بر مجوز معتبرند (پیش‌فرض‌های قدیمیِ «روشن» و سوییچ‌های دستی نادیده گرفته می‌شوند)
    if (isPermissionKind(r.kind) && r.source !== 'permission') continue
    s[r.kind] = r.granted // آخرین رکورد هر نوع معتبر است
  }
  return s
}
export function recordConsent(kv: KV, subjectId: string, kind: ConsentKind, granted: boolean, now = new Date(), source: ConsentRecord['source'] = 'settings'): ConsentRecord[] {
  const records = loadConsentRecords(kv)
  if (consentSummary(records)[kind] === granted && records.some((r) => r.kind === kind)) return records
  const next = [...records, { consent_id: randomId('c'), subject_id: subjectId, kind, granted, recorded_at: nowISO(now), policy_version: POLICY_VERSION, source }]
  try { kv.setItem(KEY, JSON.stringify(next)) } catch { /* فقط حافظه */ }
  return next
}
export const clearConsent = (kv: KV) => kv.removeItem(KEY)

/** همگام‌سازی رضایت اعلان/موقعیت با وضعیت واقعی مجوز. فقط هنگام تغییر (یا اصلاح رکورد «روشنِ» قدیمی بدون مجوز) رکورد جدید می‌نویسد؛ اگر تغییری نبود null برمی‌گرداند. */
export function syncPermissionConsent(kv: KV, subjectId: string, kind: ConsentKind, granted: boolean, now = new Date()): ConsentRecord[] | null {
  if (!isPermissionKind(kind)) return null
  const records = loadConsentRecords(kv)
  const last = [...records].reverse().find((r) => r.kind === kind)
  const current = last?.source === 'permission' ? last.granted : false
  const stale = !!last && last.source !== 'permission' && last.granted // رکورد قدیمی که بدون مجوز «روشن» ثبت شده و روی سرور هم هست
  if (granted === current && !stale) return null
  const next = [...records, { consent_id: randomId('c'), subject_id: subjectId, kind, granted, recorded_at: nowISO(now), policy_version: POLICY_VERSION, source: 'permission' as const }]
  try { kv.setItem(KEY, JSON.stringify(next)) } catch { /* فقط حافظه */ }
  return next
}
/** رکوردهای پیش‌فرض تحلیل/تبلیغات (اگر هنوز رکوردی ندارند) تا سرور مبنای وضعیت را بداند. انتخاب صریح قبلیِ کاربر هرگز بازنویسی نمی‌شود. اعلان/موقعیت اینجا ساخته نمی‌شود؛ فقط از مجوز واقعی می‌آید. */
export function seedDefaultConsents(kv: KV, subjectId: string, now = new Date()): ConsentRecord[] {
  const records = loadConsentRecords(kv)
  const missing = CONSENT_KINDS.filter((k) => !isPermissionKind(k) && !records.some((r) => r.kind === k))
  if (!missing.length) return records
  const next = [...records, ...missing.map((kind): ConsentRecord => ({ consent_id: randomId('c'), subject_id: subjectId, kind, granted: DEFAULT_CONSENT[kind], recorded_at: nowISO(now), policy_version: POLICY_VERSION, source: 'default' }))]
  try { kv.setItem(KEY, JSON.stringify(next)) } catch { /* فقط حافظه */ }
  return next
}
