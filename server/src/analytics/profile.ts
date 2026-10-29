import type { ConsentRow, EventRow } from '../store/types.js'

// محاسبهٔ پروفایل رفتاری یک کاربر و آمار کلی از رویدادهای ذخیره‌شده (/api/events). توابع خالص و بدون وابستگی به ذخیره‌سازی‌اند.
// منطق امتیاز علایق عمداً همان src/analytics/interest.ts در کلاینت است (وزن‌ها و نیم‌عمر یکسان)؛ tests/analytics-profile.test.ts یکسان‌ماندن را بررسی می‌کند.
const DAY = 86_400_000
export const INTEREST_MIN_SCORE = 3 // حداقل امتیاز برای نمایش به‌عنوان علاقهٔ اصلی (مثل query.ts کلاینت)
export const WEIGHTS: Record<string, number> = {
  view_destination: 1, view_tour: 1, view_organizer: 0.5, destination_dwell: 2, search: 0.5,
  favorite_add: 5, favorite_remove: -5, use_filter: 3, select_season: 2, select_budget: 3, select_travel_style: 3, select_scope: 3, offer_click: 4, notification_open: 1,
}
const EXPLICIT = ['favorite_add', 'use_filter', 'select_season', 'select_budget', 'select_travel_style', 'select_scope']
const HALF_LIFE_DAYS = 60, CONFIDENCE_HALF = 4
export const CONSENT_KINDS = ['analytics', 'marketing', 'notifications', 'location'] as const
export type ConsentKind = (typeof CONSENT_KINDS)[number]

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
const numv = (v: unknown) => (typeof v === 'number' ? v : undefined)

export interface Interest { interest_key: string; dimension: string; value: string; score: number; confidence: number; source: 'explicit' | 'inferred'; last_interaction_at: string; supporting_event_count: number }

function dims(p: Record<string, unknown>): Array<[string, string]> {
  const d: Array<[string, string]> = []
  if (str(p.category)) d.push(['type', p.category as string])
  if (str(p.season)) d.push(['season', p.season as string])
  if (str(p.travel_style)) d.push(['style', p.travel_style as string])
  if (str(p.budget_range)) d.push(['budget', p.budget_range as string])
  if (str(p.domestic_or_international)) d.push(['scope', p.domestic_or_international === 'domestic' ? 'داخلی' : 'خارجی'])
  return d
}

export function interestsOf(events: EventRow[], now: Date): Interest[] {
  const t = now.getTime(), half = HALF_LIFE_DAYS * DAY
  const acc = new Map<string, { dim: string; value: string; raw: number; n: number; last: string; explicit: boolean }>()
  for (const e of events) {
    const w = WEIGHTS[e.event_type] ?? 0
    if (!w) continue
    const decay = Math.pow(0.5, Math.max(0, t - Date.parse(e.occurred_at)) / half)
    for (const [dim, value] of dims(e.props)) {
      const key = `${dim}:${value}`
      const a = acc.get(key) ?? { dim, value, raw: 0, n: 0, last: e.occurred_at, explicit: false }
      a.raw += w * decay; a.n += 1
      if (e.occurred_at > a.last) a.last = e.occurred_at
      if (EXPLICIT.includes(e.event_type) && w > 0) a.explicit = true
      acc.set(key, a)
    }
  }
  const out: Interest[] = []
  for (const [key, a] of acc) {
    if (a.raw <= 0) continue
    out.push({ interest_key: key, dimension: a.dim, value: a.value, score: Math.round(a.raw * 100) / 100, confidence: Math.round((1 - Math.pow(0.5, a.n / CONFIDENCE_HALF)) * 100) / 100, source: a.explicit ? 'explicit' : 'inferred', last_interaction_at: a.last, supporting_event_count: a.n })
  }
  return out.sort((a, b) => b.score - a.score || a.interest_key.localeCompare(b.interest_key))
}

/** علاقه‌مندی‌های فعلی با بازپخش افزودن/حذف به ترتیب زمان */
export function favoritesOf(events: EventRow[]): { destination: number[]; tour: number[] } {
  const dest = new Set<number>(), tour = new Set<number>()
  for (const e of [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))) {
    if (e.event_type !== 'favorite_add' && e.event_type !== 'favorite_remove') continue
    const add = e.event_type === 'favorite_add', d = numv(e.props.destination_id), tr = numv(e.props.tour_id)
    if (d != null) add ? dest.add(d) : dest.delete(d)
    if (tr != null) add ? tour.add(tr) : tour.delete(tr)
  }
  return { destination: [...dest], tour: [...tour] }
}

/** رضایت فعلی هر نوع (آخرین رکورد بر اساس زمان). null = هنوز رکوردی به سرور نرسیده.
 *  اعلان/موقعیت مثل کلاینت فقط از رکوردهای مبتنی بر مجوز (source=permission) می‌آیند؛ رکورد «پیش‌فرضِ روشن» نسخه‌های قدیمی مجوز واقعی نبود. */
export function consentOf(rows: ConsentRow[]): Record<ConsentKind, boolean | null> {
  const out: Record<ConsentKind, boolean | null> = { analytics: null, marketing: null, notifications: null, location: null }
  const at: Partial<Record<ConsentKind, string>> = {}
  for (const r of rows) {
    const k = r.kind as ConsentKind
    if (!CONSENT_KINDS.includes(k)) continue
    if ((k === 'notifications' || k === 'location') && r.source !== 'permission') continue
    if (!at[k] || r.recorded_at >= at[k]!) { out[k] = r.granted; at[k] = r.recorded_at }
  }
  return out
}

export interface UserProfile {
  event_count: number; sessions_in_events: number; last_event_at?: string
  destinations_viewed: number; top_interests: string[]; interests: Interest[]
  favorites: { destination: number[]; tour: number[] }
  seasons: Record<string, number>; filters_used: Record<string, number>
  viewed_destinations: Array<{ id: number; views: number; approx_seconds: number }>; viewed_tours: number[]
  offer_clicks: number; searches: number; notification_opens: number
  event_types: Record<string, number>
  /** همهٔ مقصدهای دیده‌شده و کلید علایق «قوی» (امتیاز ≥ حداقل)؛ برای فیلتر مخاطب (در پاسخ جزئیات نمی‌آید) */
  viewed_destination_ids: number[]; strong_interests: string[]
}

export function profileOf(events: EventRow[], now: Date): UserProfile {
  const seasons: Record<string, number> = {}, filters: Record<string, number> = {}, types: Record<string, number> = {}
  const dest = new Map<number, { views: number; sec: number }>(), tours = new Set<number>(), sessions = new Set<string>()
  let offers = 0, searches = 0, opens = 0, last: string | undefined
  for (const e of events) {
    types[e.event_type] = (types[e.event_type] ?? 0) + 1
    sessions.add(e.session_id)
    if (!last || e.occurred_at > last) last = e.occurred_at
    const season = str(e.props.season), d = numv(e.props.destination_id), tour = numv(e.props.tour_id)
    if (e.event_type === 'select_season' && season) seasons[season] = (seasons[season] ?? 0) + 1
    if (Array.isArray(e.props.filters)) for (const f of e.props.filters) if (typeof f === 'string') filters[f] = (filters[f] ?? 0) + 1
    if (d != null) {
      const x = dest.get(d) ?? { views: 0, sec: 0 }
      if (e.event_type === 'view_destination') x.views++
      if (e.event_type === 'destination_dwell') x.sec += numv(e.props.duration_sec) ?? 0
      dest.set(d, x)
    }
    if (e.event_type === 'view_tour' && tour != null) tours.add(tour)
    if (e.event_type === 'offer_click') offers++
    if (e.event_type === 'search') searches++
    if (e.event_type === 'notification_open') opens++
  }
  const interests = interestsOf(events, now)
  return {
    event_count: events.length, sessions_in_events: sessions.size, ...(last ? { last_event_at: last } : {}),
    destinations_viewed: [...dest.values()].filter((x) => x.views > 0).length,
    top_interests: interests.filter((i) => i.score >= INTEREST_MIN_SCORE).slice(0, 3).map((i) => i.value),
    interests: interests.slice(0, 12), favorites: favoritesOf(events), seasons, filters_used: filters,
    viewed_destinations: [...dest].map(([id, v]) => ({ id, views: v.views, approx_seconds: v.sec })).filter((x) => x.views > 0).sort((a, b) => b.views - a.views).slice(0, 20),
    viewed_tours: [...tours].slice(0, 50), offer_clicks: offers, searches, notification_opens: opens, event_types: types,
    viewed_destination_ids: [...dest].filter(([, v]) => v.views > 0).map(([id]) => id), strong_interests: interests.filter((i) => i.score >= INTEREST_MIN_SCORE).map((i) => i.interest_key),
  }
}

export interface EventStats {
  topDestinations: Array<{ id: number; viewers: number }>; topSeasons: Array<{ name: string; count: number }>; topCategories: Array<{ name: string; count: number }>
  favorites: number; searches: number; offerClicks: number; notificationOpens: number; sessions: number
}
/** آمار ۳۰ روز اخیر. «بیننده» = شخص یکتا (personOf شناسه‌های نصبِ یک حساب را یکی می‌کند)، نه تعداد رویداد. */
export function statsOf(events: EventRow[], now: Date, personOf: (anonId: string) => string = (a) => a): EventStats {
  const since = now.getTime() - 30 * DAY
  const dest = new Map<number, Set<string>>(), seasons = new Map<string, Set<string>>(), cats = new Map<string, Set<string>>(), sessions = new Set<string>()
  const add = <K,>(m: Map<K, Set<string>>, k: K, who: string) => { const s = m.get(k) ?? new Set<string>(); s.add(who); m.set(k, s) }
  let searches = 0, offers = 0, opens = 0
  const recent = events.filter((e) => Date.parse(e.occurred_at) >= since)
  for (const e of recent) {
    const who = personOf(e.anonymous_id), season = str(e.props.season), cat = str(e.props.category), d = numv(e.props.destination_id)
    sessions.add(e.session_id)
    if (e.event_type === 'view_destination' && d != null) add(dest, d, who)
    if (season && (e.event_type === 'select_season' || e.event_type === 'view_season')) add(seasons, season, who)
    if (cat && e.event_type === 'view_destination') add(cats, cat, who)
    if (e.event_type === 'search') searches++
    if (e.event_type === 'offer_click') offers++
    if (e.event_type === 'notification_open') opens++
  }
  const top = <K,>(m: Map<K, Set<string>>) => [...m].map(([k, s]) => [k, s.size] as const).sort((a, b) => b[1] - a[1]).slice(0, 5)
  // علاقه‌مندی‌ها: مجموع فهرست فعلی هر شناسه (با بازپخش افزودن/حذف روی همهٔ رویدادها، نه فقط ۳۰ روز)
  const byAnon = new Map<string, EventRow[]>()
  for (const e of events) if (e.event_type === 'favorite_add' || e.event_type === 'favorite_remove') { const l = byAnon.get(e.anonymous_id) ?? []; l.push(e); byAnon.set(e.anonymous_id, l) }
  let favorites = 0
  for (const l of byAnon.values()) { const f = favoritesOf(l); favorites += f.destination.length + f.tour.length }
  return {
    topDestinations: top(dest).map(([id, viewers]) => ({ id, viewers })), topSeasons: top(seasons).map(([name, count]) => ({ name, count })),
    topCategories: top(cats).map(([name, count]) => ({ name, count })), favorites, searches, offerClicks: offers, notificationOpens: opens, sessions: sessions.size,
  }
}
