import type { Page, ProfileRecord, UserDetail, UserSummary } from './profiles'

const DAY = 86400_000
export const ACTIVE_WINDOW_DAYS = 30 // «فعال» = حداقل یک رویداد ثبت‌شده در ۳۰ روز گذشته
export const INTEREST_MIN_SCORE = 3 // حداقل امتیاز برای اینکه علاقه در فیلتر حساب شود
export const ENGAGEMENT_BANDS = { medium: 10, high: 30 } // تعداد رویداد

export interface ProfileFilters {
  query?: string
  status?: 'guest' | 'registered'
  registeredFrom?: string; registeredTo?: string
  firstSeenWithinDays?: number
  lastActiveWithinDays?: number
  active?: boolean
  country?: string; province?: string; city?: string
  season?: string; destType?: string; style?: string; budget?: string; scope?: 'داخلی' | 'خارجی'
  viewedDestinationId?: number
  hasFavorites?: boolean
  minSessions?: number
  engagement?: 'low' | 'medium' | 'high'
  marketingConsent?: boolean
}
export type SortKey = 'last_active_at' | 'first_seen_at' | 'sessions' | 'destinations_viewed' | 'event_count'
export interface ListQuery { filters?: ProfileFilters; sort?: SortKey; dir?: 'asc' | 'desc'; page?: number; pageSize?: number }

const norm = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()
export const sessionsOf = (p: ProfileRecord) => new Set(p.events.map((e) => e.session_id)).size
export const engagementOf = (p: ProfileRecord): 'low' | 'medium' | 'high' => p.events.length >= ENGAGEMENT_BANDS.high ? 'high' : p.events.length >= ENGAGEMENT_BANDS.medium ? 'medium' : 'low'
const hasInterest = (p: ProfileRecord, key: string) => p.interests.some((i) => i.interest_key === key && i.score >= INTEREST_MIN_SCORE)

export function matches(p: ProfileRecord, f: ProfileFilters, now: Date): boolean {
  const t = now.getTime()
  // فیلدهای ناموجود هرگز با فیلتر مطابقت نمی‌کنند (کاربر بدون شهر در «شهر=تهران» نمی‌آید)
  if (f.query) { const q = norm(f.query); if (!norm(p.id).includes(q) && !norm(p.display_name ?? '').includes(q)) return false }
  if (f.status && p.status !== f.status) return false
  if (f.registeredFrom && !(p.registered_at && p.registered_at >= f.registeredFrom)) return false
  if (f.registeredTo && !(p.registered_at && p.registered_at <= f.registeredTo)) return false
  if (f.firstSeenWithinDays != null && !(t - Date.parse(p.first_seen_at) <= f.firstSeenWithinDays * DAY)) return false
  if (f.lastActiveWithinDays != null && !(t - Date.parse(p.last_active_at) <= f.lastActiveWithinDays * DAY)) return false
  if (f.active != null && (t - Date.parse(p.last_active_at) <= ACTIVE_WINDOW_DAYS * DAY) !== f.active) return false
  if (f.country && p.country !== f.country) return false
  if (f.province && p.province !== f.province) return false
  if (f.city && p.city !== f.city) return false
  if (f.season && !hasInterest(p, `season:${f.season}`)) return false
  if (f.destType && !hasInterest(p, `type:${f.destType}`)) return false
  if (f.style && !hasInterest(p, `style:${f.style}`)) return false
  if (f.budget && !hasInterest(p, `budget:${f.budget}`)) return false
  if (f.scope && !hasInterest(p, `scope:${f.scope}`)) return false
  if (f.viewedDestinationId != null && !p.events.some((e) => e.event_type === 'view_destination' && e.destination_id === f.viewedDestinationId)) return false
  if (f.hasFavorites != null && (p.favorites.destination.length + p.favorites.tour.length > 0) !== f.hasFavorites) return false
  if (f.minSessions != null && sessionsOf(p) < f.minSessions) return false
  if (f.engagement && engagementOf(p) !== f.engagement) return false
  if (f.marketingConsent != null && p.consent.marketing !== f.marketingConsent) return false
  return true
}

export const PRESETS: Array<{ id: string; label: string; filters: ProfileFilters }> = [
  { id: 'forest', label: 'علاقه‌مند به جنگل', filters: { destType: 'جنگل' } },
  { id: 'desert', label: 'علاقه‌مند به کویر', filters: { destType: 'کویر' } },
  { id: 'beach', label: 'علاقه‌مند به ساحل', filters: { destType: 'ساحل' } },
  { id: 'mountain', label: 'علاقه‌مند به کوهستان', filters: { destType: 'کوهستان' } },
  { id: 'historic', label: 'علاقه‌مند به مقصدهای تاریخی', filters: { destType: 'تاریخی' } },
  { id: 'domestic', label: 'علاقه‌مند به سفر داخلی', filters: { scope: 'داخلی' } },
  { id: 'intl', label: 'علاقه‌مند به سفر خارجی', filters: { scope: 'خارجی' } },
  { id: 'economy', label: 'علاقه‌مند به سفر اقتصادی', filters: { budget: 'اقتصادی' } },
  { id: 'luxury', label: 'علاقه‌مند به سفر لوکس', filters: { budget: 'لوکس' } },
  { id: 'spring', label: 'علاقه‌مند به بهار', filters: { season: 'بهار' } },
  { id: 'summer', label: 'علاقه‌مند به تابستان', filters: { season: 'تابستان' } },
  { id: 'autumn', label: 'علاقه‌مند به پاییز', filters: { season: 'پاییز' } },
  { id: 'winter', label: 'علاقه‌مند به زمستان', filters: { season: 'زمستان' } },
  { id: 'new', label: 'کاربران جدید', filters: { firstSeenWithinDays: 7 } },
  { id: 'recent', label: 'کاربران فعال اخیر', filters: { lastActiveWithinDays: 7 } },
  { id: 'guests', label: 'کاربران مهمان', filters: { status: 'guest' } },
  { id: 'registered', label: 'کاربران ثبت‌نام‌شده', filters: { status: 'registered' } },
]

export function summarize(p: ProfileRecord): UserSummary {
  return {
    id: p.id, status: p.status, state: p.state, display_name: p.display_name, city: p.city, first_seen_at: p.first_seen_at, last_active_at: p.last_active_at,
    sessions: sessionsOf(p), event_count: p.events.length,
    destinations_viewed: new Set(p.events.filter((e) => e.event_type === 'view_destination' && e.destination_id != null).map((e) => e.destination_id)).size,
    top_interests: p.interests.filter((i) => i.score >= INTEREST_MIN_SCORE).slice(0, 3).map((i) => i.value),
  }
}

export function listProfiles(all: ProfileRecord[], q: ListQuery, now = new Date()): Page<UserSummary> {
  const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20))
  const rows = all.filter((p) => p.state !== 'deleted' && matches(p, q.filters ?? {}, now)).map(summarize)
  const key = q.sort ?? 'last_active_at', sign = q.dir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const x = a[key], y = b[key]
    return (typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y))) * sign || a.id.localeCompare(b.id)
  })
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(pages, Math.max(1, q.page ?? 1))
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize }
}

export function detailOf(p: ProfileRecord, includeContact: boolean): UserDetail {
  const seasons: Record<string, number> = {}, filters: Record<string, number> = {}
  const dest = new Map<number, { views: number; sec: number }>()
  const tours = new Set<number>()
  let offers = 0
  for (const e of p.events) {
    if (e.event_type === 'select_season' && e.season) seasons[e.season] = (seasons[e.season] ?? 0) + 1
    if (e.filters) e.filters.forEach((f) => { filters[f] = (filters[f] ?? 0) + 1 })
    if (e.destination_id != null) {
      const d = dest.get(e.destination_id) ?? { views: 0, sec: 0 }
      if (e.event_type === 'view_destination') d.views++
      if (e.event_type === 'destination_dwell') d.sec += e.duration_sec ?? 0
      dest.set(e.destination_id, d)
    }
    if (e.event_type === 'view_tour' && e.tour_id != null) tours.add(e.tour_id)
    if (e.event_type === 'offer_click') offers++
  }
  return {
    ...summarize(p), country: p.country, province: p.province, registered_at: p.registered_at, anonymous_ids: p.anonymous_ids, favorites: p.favorites, interests: p.interests,
    consent: p.consent, notifications: p.notifications, merge_logs: p.merge_logs, seasons, filters_used: filters, offer_clicks: offers, viewed_tours: [...tours],
    viewed_destinations: [...dest].map(([id, v]) => ({ id, views: v.views, approx_seconds: v.sec })).sort((a, b) => b.views - a.views),
    ...(includeContact && p.contact ? { contact: p.contact } : {}),
  }
}

export function pageEvents(p: ProfileRecord, page = 1, pageSize = 20): Page<ProfileRecord['events'][number]> {
  const size = Math.min(100, Math.max(1, pageSize))
  const sorted = [...p.events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
  return { items: sorted.slice((page - 1) * size, page * size), total: sorted.length, page, pageSize: size }
}

export interface DashboardStats {
  total: number; guests: number; registered: number
  dau: number; wau: number; mau: number
  newProfiles: number; returning: number; sessions: number
  topDestinations: Array<{ id: number; viewers: number }>
  topSeasons: Array<{ name: string; count: number }>
  topCategories: Array<{ name: string; count: number }>
  favorites: number; searches: number; offerClicks: number; notificationOpens: number
  definitions: Record<string, string>
}
export const STAT_DEFINITIONS = {
  active: 'کاربر فعال: دست‌کم یک رویداد در بازه (روزانه ۱ روز، هفتگی ۷ روز، ماهانه ۳۰ روز). هر پروفایل یک بار شمرده می‌شود.',
  newProfiles: 'جدید: اولین مراجعه در ۳۰ روز گذشته.',
  returning: 'بازگشتی: فعال در ۷ روز گذشته و اولین مراجعه قدیمی‌تر از ۷ روز.',
  sessions: 'نشست‌ها: شناسهٔ نشست یکتا در رویدادهای ۳۰ روز گذشته.',
  popular: 'پرمشاهده/محبوب: تعداد پروفایل‌های یکتا در ۳۰ روز گذشته (نه تعداد کل رویداد).',
}

export function dashboardStats(all: ProfileRecord[], now = new Date()): DashboardStats {
  const t = now.getTime()
  const live = all.filter((p) => p.state !== 'deleted')
  const within = (iso: string, d: number) => t - Date.parse(iso) <= d * DAY
  const inWin = (p: ProfileRecord) => p.events.filter((e) => within(e.occurred_at, 30))
  const dest = new Map<number, Set<string>>(), seasons = new Map<string, Set<string>>(), cats = new Map<string, Set<string>>()
  const add = <K,>(m: Map<K, Set<string>>, k: K, id: string) => { const s = m.get(k) ?? new Set(); s.add(id); m.set(k, s) }
  const sessions = new Set<string>(); const seen = new Set<string>()
  let searches = 0, offers = 0, opens = 0
  for (const p of live) for (const e of inWin(p)) {
    if (seen.has(e.event_id)) continue
    seen.add(e.event_id); sessions.add(e.session_id)
    if (e.event_type === 'view_destination' && e.destination_id != null) add(dest, e.destination_id, p.id)
    if (e.season && (e.event_type === 'select_season' || e.event_type === 'view_season')) add(seasons, e.season, p.id)
    if (e.category && e.event_type === 'view_destination') add(cats, e.category, p.id)
    if (e.event_type === 'search') searches++
    if (e.event_type === 'offer_click') offers++
    if (e.event_type === 'notification_open') opens++
  }
  const top = <K,>(m: Map<K, Set<string>>) => [...m].map(([k, s]) => [k, s.size] as const).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return {
    total: live.length, guests: live.filter((p) => p.status === 'guest').length, registered: live.filter((p) => p.status === 'registered').length,
    dau: live.filter((p) => within(p.last_active_at, 1)).length, wau: live.filter((p) => within(p.last_active_at, 7)).length, mau: live.filter((p) => within(p.last_active_at, 30)).length,
    newProfiles: live.filter((p) => within(p.first_seen_at, 30)).length,
    returning: live.filter((p) => within(p.last_active_at, 7) && !within(p.first_seen_at, 7)).length,
    sessions: sessions.size,
    topDestinations: top(dest).map(([id, viewers]) => ({ id, viewers })),
    topSeasons: top(seasons).map(([name, count]) => ({ name, count })),
    topCategories: top(cats).map(([name, count]) => ({ name, count })),
    favorites: live.reduce((n, p) => n + p.favorites.destination.length + p.favorites.tour.length, 0),
    searches, offerClicks: offers, notificationOpens: opens, definitions: STAT_DEFINITIONS,
  }
}

export interface AudienceCounts { matched: number; eligible: number; excluded: { noMarketingConsent: number; unsubscribed: number; frequencyCap: number; inactiveAccount: number } }
export const FREQUENCY_CAP_DAYS = 7
/** پیش‌نمایش مخاطب: فقط شمارش؛ هیچ اطلاعات شخصی برنمی‌گردد. فقط کسانی واجد شرایطند که رضایت تبلیغاتی دارند. */
export function previewAudience(all: ProfileRecord[], filters: ProfileFilters, now = new Date()): AudienceCounts {
  const res: AudienceCounts = { matched: 0, eligible: 0, excluded: { noMarketingConsent: 0, unsubscribed: 0, frequencyCap: 0, inactiveAccount: 0 } }
  for (const p of all) {
    if (p.state === 'deleted' || !matches(p, { ...filters, marketingConsent: undefined }, now)) continue
    res.matched++
    if (p.state !== 'active') res.excluded.inactiveAccount++
    else if (p.notifications.unsubscribed_at) res.excluded.unsubscribed++
    else if (!p.consent.marketing || !p.notifications.promotional) res.excluded.noMarketingConsent++
    else if (p.notifications.last_promotional_sent_at && now.getTime() - Date.parse(p.notifications.last_promotional_sent_at) < FREQUENCY_CAP_DAYS * DAY) res.excluded.frequencyCap++
    else res.eligible++
  }
  return res
}
