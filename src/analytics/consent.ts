import { nowISO, randomId, type KV } from './ids'
import type { ConsentKind, ConsentRecord, ConsentSummary } from './types'

// تصمیم محصول: «تحلیل ناشناس» و «تبلیغات شخصی‌سازی‌شده» به‌طور پیش‌فرض روشن‌اند (بدون پنجرهٔ رضایت) و هر زمان از «حریم خصوصی و رضایت» قابل خاموش‌کردن‌اند.
// اعلان‌ها و موقعیت پیش‌فرض خاموش‌اند. هر نوع جدا مدیریت می‌شود و پیش‌فرض‌ها هم با نسخهٔ سیاست و زمان ثبت می‌شوند (source: 'default').
export const POLICY_VERSION = '2026-10-v3'
export const CONSENT_KINDS: ConsentKind[] = ['analytics', 'marketing', 'notifications', 'location']
export const DEFAULT_CONSENT: ConsentSummary = { analytics: true, marketing: true, notifications: false, location: false }
export const NO_CONSENT: ConsentSummary = { analytics: false, marketing: false, notifications: false, location: false }
const KEY = 'taghvim-consent-v1'

export function loadConsentRecords(kv: KV): ConsentRecord[] {
  try { const v = JSON.parse(kv.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function consentSummary(records: ConsentRecord[]): ConsentSummary {
  const s = { ...DEFAULT_CONSENT }
  for (const r of records) s[r.kind] = r.granted // آخرین رکورد هر نوع معتبر است
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

/** رکوردهای پیش‌فرض (اگر نوعی هنوز رکوردی ندارد) تا سرور مبنای وضعیت را بداند. فقط برای انواعِ پیش‌فرض‌روشن. */
export function seedDefaultConsents(kv: KV, subjectId: string, now = new Date()): ConsentRecord[] {
  const records = loadConsentRecords(kv)
  const missing = (['analytics', 'marketing'] as ConsentKind[]).filter((k) => !records.some((r) => r.kind === k))
  if (!missing.length) return records
  const next = [...records, ...missing.map((kind): ConsentRecord => ({ consent_id: randomId('c'), subject_id: subjectId, kind, granted: DEFAULT_CONSENT[kind], recorded_at: nowISO(now), policy_version: POLICY_VERSION, source: 'default' }))]
  try { kv.setItem(KEY, JSON.stringify(next)) } catch { /* فقط حافظه */ }
  return next
}
