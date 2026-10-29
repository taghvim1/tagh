import { z } from 'zod'
import type { Person } from '../auth/registry.js'
import type { ConsentKind, UserProfile } from './profile.js'

// فیلتر و ردبندی مخاطب. معناشناسی فیلتر عمداً همان src/analytics/admin/query.ts کلاینت است (فیلدِ ناموجود هرگز با فیلتر مطابقت نمی‌کند)؛
// tests/user-audience.test.ts یکسان‌ماندن را با تابع matches کلاینت بررسی می‌کند.
const DAY = 86_400_000
export const ACTIVE_WINDOW_DAYS = 30
export const FREQUENCY_CAP_DAYS = 7
export const STALE_DEFAULT_DAYS = 3 // مهمان یک‌بار-بازشده که ۳ روز برنگشته
export const ENGAGEMENT_BANDS = { medium: 10, high: 30 }
const str = z.string().max(60)
const isoStr = z.string().max(40).refine((v) => !Number.isNaN(Date.parse(v)))
const days = z.number().int().min(0).max(3650)

export const filtersSchema = z.object({
  query: z.string().max(80).optional(), status: z.enum(['guest', 'registered']).optional(),
  registeredFrom: isoStr.optional(), registeredTo: isoStr.optional(), firstSeenWithinDays: days.optional(), lastActiveWithinDays: days.optional(), active: z.boolean().optional(),
  country: str.optional(), province: str.optional(), city: str.optional(),
  season: str.optional(), destType: str.optional(), style: str.optional(), budget: str.optional(), scope: z.enum(['داخلی', 'خارجی']).optional(),
  viewedDestinationId: z.number().int().min(0).optional(), hasFavorites: z.boolean().optional(), minSessions: z.number().int().min(0).optional(),
  engagement: z.enum(['low', 'medium', 'high']).optional(), marketingConsent: z.boolean().optional(),
}).strip()
export type Filters = z.infer<typeof filtersSchema>

export interface Row { p: Person; prof: UserProfile; consent: Record<ConsentKind, boolean | null> }
export const norm = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()
export const nameOf = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined
export const engagementOf = (n: number): 'low' | 'medium' | 'high' => (n >= ENGAGEMENT_BANDS.high ? 'high' : n >= ENGAGEMENT_BANDS.medium ? 'medium' : 'low')

export function matchesRow(r: Row, f: Filters, nowMs: number): boolean {
  const { p, prof } = r
  if (f.query) { const q = norm(f.query); if (!norm(p.id).includes(q) && !norm(nameOf(p) ?? '').includes(q) && !(p.phone ?? '').includes(f.query)) return false }
  if (f.status && p.status !== f.status) return false
  if (f.registeredFrom && !(p.registered_at && p.registered_at >= f.registeredFrom)) return false
  if (f.registeredTo && !(p.registered_at && p.registered_at <= f.registeredTo)) return false
  if (f.firstSeenWithinDays != null && !(nowMs - Date.parse(p.first_seen_at) <= f.firstSeenWithinDays * DAY)) return false
  if (f.lastActiveWithinDays != null && !(nowMs - Date.parse(p.last_seen_at) <= f.lastActiveWithinDays * DAY)) return false
  if (f.active != null && (nowMs - Date.parse(p.last_seen_at) <= ACTIVE_WINDOW_DAYS * DAY) !== f.active) return false
  if (f.country || f.province) return false // شهر فقط از پروفایل می‌آید؛ کشور/استان ذخیره نمی‌شود، پس هیچ‌کس مطابقت ندارد
  if (f.city && (p.city ? norm(p.city) !== norm(f.city) : true)) return false
  const has = (k: string) => prof.strong_interests.includes(k)
  if (f.season && !has(`season:${f.season}`)) return false
  if (f.destType && !has(`type:${f.destType}`)) return false
  if (f.style && !has(`style:${f.style}`)) return false
  if (f.budget && !has(`budget:${f.budget}`)) return false
  if (f.scope && !has(`scope:${f.scope}`)) return false
  if (f.viewedDestinationId != null && !prof.viewed_destination_ids.includes(f.viewedDestinationId)) return false
  if (f.hasFavorites != null && (prof.favorites.destination.length + prof.favorites.tour.length > 0) !== f.hasFavorites) return false
  if (f.minSessions != null && (p.sessions ?? 0) < f.minSessions) return false
  if (f.engagement && engagementOf(prof.event_count) !== f.engagement) return false
  if (f.marketingConsent != null && (r.consent.marketing === true) !== f.marketingConsent) return false
  return true
}

export type Reach = 'eligible' | 'inactiveAccount' | 'unsubscribed' | 'noMarketingConsent' | 'noPushSubscription' | 'frequencyCap'
/** آیا می‌شود به این کاربر پیشنهاد تبلیغاتی فرستاد؟ دلیل نخستین مانع را برمی‌گرداند. بدون رضایت ثبت‌شده در سرور، «بدون رضایت» است. */
export function reachOf(r: Row, nowMs: number): Reach {
  const { p } = r
  if (p.state !== 'active') return 'inactiveAccount'
  if (p.promo_unsubscribed_at) return 'unsubscribed'
  if (r.consent.marketing !== true) return 'noMarketingConsent'
  if (!p.push || r.consent.notifications === false) return 'noPushSubscription'
  if (p.promo_last_sent_at && nowMs - Date.parse(p.promo_last_sent_at) < FREQUENCY_CAP_DAYS * DAY) return 'frequencyCap'
  return 'eligible'
}

export type SortKey = 'last_active_at' | 'first_seen_at' | 'sessions' | 'destinations_viewed' | 'event_count'
export const SORT_KEYS: SortKey[] = ['last_active_at', 'first_seen_at', 'sessions', 'destinations_viewed', 'event_count']
export function sortValue(r: Row, k: SortKey): number | string {
  switch (k) {
    case 'sessions': return r.p.sessions ?? 0
    case 'destinations_viewed': return r.prof.destinations_viewed
    case 'event_count': return r.prof.event_count
    case 'first_seen_at': return r.p.first_seen_at
    default: return r.p.last_seen_at
  }
}
