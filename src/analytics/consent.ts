import { nowISO, randomId, type KV } from './ids'
import type { ConsentKind, ConsentRecord, ConsentSummary } from './types'

// رضایت‌ها جدا از هم مدیریت می‌شوند و پیش‌فرض همه «عدم رضایت» است (opt-in).
export const POLICY_VERSION = '2026-10-v1'
export const CONSENT_KINDS: ConsentKind[] = ['analytics', 'marketing', 'location']
export const NO_CONSENT: ConsentSummary = { analytics: false, marketing: false, location: false }
const KEY = 'taghvim-consent-v1'

export function loadConsentRecords(kv: KV): ConsentRecord[] {
  try { const v = JSON.parse(kv.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function consentSummary(records: ConsentRecord[]): ConsentSummary {
  const s = { ...NO_CONSENT }
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
