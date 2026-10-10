import type { ActivityEvent, InterestDimension, InterestScore, UserPreferences } from './types'

/** وزن رویدادها قابل تنظیم است. مشاهدهٔ ساده وزن کم دارد و به‌تنهایی علاقهٔ قطعی نیست. */
export type EventWeights = Partial<Record<ActivityEvent['event_type'], number>>
export const DEFAULT_WEIGHTS: EventWeights = {
  view_destination: 1, view_tour: 1, view_organizer: 0.5, destination_dwell: 2, search: 0.5,
  favorite_add: 5, favorite_remove: -5, use_filter: 3, select_season: 2, select_budget: 3, select_travel_style: 3, select_scope: 3, offer_click: 4, notification_open: 1,
}
/** رویدادهایی که انتخاب صریح کاربرند (نه صرفاً مشاهده) */
const EXPLICIT: ActivityEvent['event_type'][] = ['favorite_add', 'use_filter', 'select_season', 'select_budget', 'select_travel_style', 'select_scope']
export interface InterestOptions { now?: Date; weights?: EventWeights; halfLifeDays?: number; confidenceHalf?: number }

const dims = (e: ActivityEvent): Array<[InterestDimension, string]> => {
  const d: Array<[InterestDimension, string]> = []
  if (e.category) d.push(['type', e.category])
  if (e.season) d.push(['season', e.season])
  if (e.travel_style) d.push(['style', e.travel_style])
  if (e.budget_range) d.push(['budget', e.budget_range])
  if (e.domestic_or_international) d.push(['scope', e.domestic_or_international === 'domestic' ? 'داخلی' : 'خارجی'])
  return d
}

/** امتیاز علایق از رویدادها. تابع خالص و تکرارپذیر؛ علاقهٔ صریح از استنباطی جدا و ترجیحات حذف‌شدهٔ کاربر رعایت می‌شود. */
export function computeInterests(events: ActivityEvent[], prefs?: Pick<UserPreferences, 'explicit_interests' | 'hidden_interests'>, o: InterestOptions = {}): InterestScore[] {
  const now = (o.now ?? new Date()).getTime()
  const w = { ...DEFAULT_WEIGHTS, ...o.weights }
  const half = (o.halfLifeDays ?? 60) * 86400_000
  const cHalf = o.confidenceHalf ?? 4
  const acc = new Map<string, { dim: InterestDimension; value: string; raw: number; n: number; last: string; explicit: boolean }>()
  const seen = new Set<string>()
  for (const e of events) {
    if (seen.has(e.event_id)) continue // شمارش یک رویداد دوبار ممکن نیست
    seen.add(e.event_id)
    const weight = w[e.event_type] ?? 0
    if (!weight) continue
    const decay = Math.pow(0.5, Math.max(0, now - Date.parse(e.occurred_at)) / half)
    for (const [dim, value] of dims(e)) {
      const key = `${dim}:${value}`
      const a = acc.get(key) ?? { dim, value, raw: 0, n: 0, last: e.occurred_at, explicit: false }
      a.raw += weight * decay; a.n += 1
      if (e.occurred_at > a.last) a.last = e.occurred_at
      if (EXPLICIT.includes(e.event_type) && weight > 0) a.explicit = true
      acc.set(key, a)
    }
  }
  const hidden = new Set(prefs?.hidden_interests ?? [])
  const stamp = new Date(now).toISOString()
  const out: InterestScore[] = []
  for (const [key, a] of acc) {
    if (hidden.has(key) || a.raw <= 0) continue
    out.push({ interest_key: key, dimension: a.dim, value: a.value, score: Math.round(a.raw * 100) / 100, confidence: Math.round((1 - Math.pow(0.5, a.n / cHalf)) * 100) / 100,
      source: a.explicit ? 'explicit' : 'inferred', last_interaction_at: a.last, supporting_event_count: a.n, updated_at: stamp })
  }
  // انتخاب‌های ثبت‌شدهٔ کاربر در ترجیحات همیشه صریح‌اند
  for (const key of prefs?.explicit_interests ?? []) {
    const [dim, ...rest] = key.split(':'); const value = rest.join(':')
    const ex = out.find((x) => x.interest_key === key)
    if (ex) ex.source = 'explicit'
    else out.push({ interest_key: key, dimension: dim as InterestDimension, value, score: 0, confidence: 1, source: 'explicit', last_interaction_at: stamp, supporting_event_count: 0, updated_at: stamp })
  }
  return out.sort((a, b) => b.score - a.score || a.interest_key.localeCompare(b.interest_key))
}
