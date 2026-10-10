// داده‌ی «ساختگی» برای نمایش پنل. هیچ‌کدام کاربر واقعی نیست و هرگز نباید به‌جای داده‌ی سرور استفاده شود.
import { MOCK_DESTINATIONS, type Destination } from '../../data/destinations'
import { computeInterests } from '../interest'
import type { ActivityEvent, EventType } from '../types'
import type { ProfileRecord } from './profiles'

const CITIES: Array<[string, string]> = [['تهران', 'تهران'], ['اصفهان', 'اصفهان'], ['شیراز', 'فارس'], ['مشهد', 'خراسان رضوی'], ['تبریز', 'آذربایجان شرقی'], ['رشت', 'گیلان'], ['یزد', 'یزد'], ['اهواز', 'خوزستان']]
const NAMES = ['علی', 'مریم', 'حسین', 'زهرا', 'رضا', 'سارا', 'نرگس', 'امیر', 'مهدی', 'فاطمه']
const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان']
const TYPES = ['جنگل', 'کویر', 'ساحل', 'کوهستان', 'تاریخی', 'فرهنگی', 'طبیعت']

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

export function buildDemoProfiles(now = new Date(), count = 80, dests: Destination[] = MOCK_DESTINATIONS): ProfileRecord[] {
  const r = rng(20261010)
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const out: ProfileRecord[] = []
  for (let n = 1; n <= count; n++) {
    const registered = r() < 0.45
    const ageDays = Math.floor(r() * 90)
    const lastGap = Math.floor(r() * Math.min(ageDays + 1, 45) * (r() < 0.3 ? 1 : 0.3))
    const first = now.getTime() - ageDays * 86400_000
    const fav = pick(TYPES), favSeason = pick(SEASONS)
    const anon = `demo_anon_${String(n).padStart(3, '0')}`
    const id = registered ? `demo_user_${String(n).padStart(3, '0')}` : anon
    const sessionsN = 1 + Math.floor(r() * 6)
    const events: ActivityEvent[] = []
    const eventsN = 3 + Math.floor(r() * 45)
    for (let k = 0; k < eventsN; k++) {
      const when = new Date(Math.max(first, now.getTime() - lastGap * 86400_000 - r() * Math.max(1, ageDays - lastGap) * 86400_000))
      const sess = `demo_s_${n}_${k % sessionsN}`
      const preferred = dests.filter((d) => (d.type as string[]).includes(fav))
      const d = r() < 0.6 && preferred.length ? pick(preferred) : pick(dests)
      const types: EventType[] = ['view_destination', 'view_destination', 'destination_dwell', 'select_season', 'search', 'favorite_add', 'view_tour', 'offer_click', 'notification_open', 'use_filter']
      const t = pick(types)
      const base: ActivityEvent = { event_id: `demo_e_${n}_${k}`, anonymous_id: anon, ...(registered ? { user_id: id } : {}), event_type: t, occurred_at: when.toISOString(), session_id: sess, app_version: '1.0.0', platform: 'pwa', consent_context: { analytics: true, marketing: false, location: false } }
      if (t === 'view_destination' || t === 'destination_dwell' || t === 'favorite_add') Object.assign(base, { destination_id: d.id, category: d.type[0], budget_range: d.budget, domestic_or_international: d.scope, season: r() < 0.5 ? favSeason : pick(SEASONS) })
      if (t === 'destination_dwell') base.duration_sec = 5 + Math.floor(r() * 120)
      if (t === 'select_season') base.season = r() < 0.6 ? favSeason : pick(SEASONS)
      if (t === 'search') base.query_length = 2 + Math.floor(r() * 10)
      if (t === 'view_tour') base.tour_id = 1 + Math.floor(r() * 3)
      if (t === 'use_filter') { base.filters = [pick(['بودجه', 'سبک سفر', 'داخلی/خارجی'])]; if (r() < 0.5) base.budget_range = pick(['اقتصادی', 'متوسط', 'لوکس']) }
      events.push(base)
    }
    const last = events.reduce((m, e) => (e.occurred_at > m ? e.occurred_at : m), new Date(first).toISOString())
    const [city, province] = pick(CITIES)
    const hasCity = r() < 0.6
    const favs = events.filter((e) => e.event_type === 'favorite_add' && e.destination_id != null).map((e) => e.destination_id!)
    const marketing = registered && r() < 0.5
    out.push({
      id, anonymous_ids: [anon], status: registered ? 'registered' : 'guest', state: 'active',
      ...(registered ? { display_name: `${pick(NAMES)} (نمونه)` } : {}), ...(hasCity && registered ? { country: 'ایران', province, city } : {}),
      first_seen_at: new Date(first).toISOString(), ...(registered ? { registered_at: new Date(first + 3600_000).toISOString() } : {}), last_active_at: last,
      events, favorites: { destination: [...new Set(favs)], tour: [] },
      interests: computeInterests(events, undefined, { now }),
      consent: { analytics: true, marketing, location: false },
      notifications: { subject_id: id, operational: true, promotional: marketing, updated_at: now.toISOString(), ...(marketing && r() < 0.2 ? { last_promotional_sent_at: new Date(now.getTime() - 2 * 86400_000).toISOString() } : {}) },
      ...(registered ? { contact: { email: `demo${n}@example.invalid` } } : {}),
      merge_logs: registered && r() < 0.5 ? [{ merge_id: `demo_m_${n}`, user_id: id, anonymous_id: anon, status: 'success', events_linked: events.length, events_skipped_duplicates: 0, favorites_added: favs.length, created_at: new Date(first + 3600_000).toISOString() }] : [],
    })
  }
  return out
}
