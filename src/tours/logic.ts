// منطق تورها (جدا از UI): تاریخ، مدت، پیش‌رو بودن و فیلترها.
import { DURATIONS } from '../data/destinations'
import { fromGregorian, shiftMonth } from '../lib/jalali'
import type { TourOrganizer } from '../tour-organizers/types'
import { seasonOfMonth } from '../travel/season'
import { DIFFICULTIES, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, TRAVEL_STYLES, type Tour } from './types'

export const ALL = 'همه'
export const SEASON_OPTIONS = [ALL, 'بهار', 'تابستان', 'پاییز', 'زمستان'] as const
export const SCOPE_OPTIONS = [ALL, 'داخلی', 'خارجی'] as const
export const TYPE_OPTIONS = [ALL, ...TOUR_TYPES] as const
export const DURATION_OPTIONS = [ALL, ...DURATIONS] as const
export const BUDGET_OPTIONS = [ALL, ...TOUR_BUDGETS] as const
export const DIFFICULTY_OPTIONS = [ALL, ...DIFFICULTIES] as const
export const STYLE_OPTIONS = [ALL, ...TRAVEL_STYLES] as const
export const COMPANION_OPTIONS = [ALL, ...TOUR_COMPANIONS] as const
export const DATE_OPTIONS = [ALL, 'این هفته', 'این ماه', 'ماه بعد'] as const

export interface TourFilters {
  season: string; scope: string; type: string; duration: string; budget: string
  difficulty: string; travelStyle: string; suitableFor: string; date: string
  /** نام برگزارکننده (یا «همه») */
  organizer: string
}
export const EMPTY_TOUR_FILTERS: TourFilters = { season: ALL, scope: ALL, type: ALL, duration: ALL, budget: ALL, difficulty: ALL, travelStyle: ALL, suitableFor: ALL, date: ALL, organizer: ALL }
export const activeTourFilterCount = (f: TourFilters) => Object.values(f).filter((v) => v !== ALL).length

const DAY = 86_400_000
export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12) }
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)

/** تعداد روزهای تور (شامل روز اول و آخر) */
export const tourDays = (start: string, end: string) => Math.max(1, Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / DAY) + 1)
export const durationLabel = (days: number): Tour['duration'] => (days <= 1 ? 'یک روزه' : days <= 3 ? '۲ تا ۳ روز' : days <= 7 ? '۴ تا ۷ روز' : 'بیش از یک هفته')
export const withDuration = (t: Tour): Tour => ({ ...t, duration: durationLabel(tourDays(t.startDate, t.endDate)) })

/** فقط تورهای پیش‌رو: فعال و تاریخ شروع از امروز به بعد */
export const isUpcoming = (t: Tour, now: Date) => t.active && parseISO(t.startDate) >= startOfDay(now)

/** تور عمومی: پیش‌رو و برگزارکنندهٔ آن موجود و فعال است. تقویم و فهرست تورها هر دو فقط از این استفاده می‌کنند. */
export function publicTours(list: Tour[], organizers: TourOrganizer[], now: Date = new Date()): Tour[] {
  const ok = new Set(organizers.filter((o) => o.active).map((o) => o.id))
  return list.filter((t) => ok.has(t.organizerId) && isUpcoming(t, now))
}

export const tourSeason = (t: Tour) => seasonOfMonth(fromGregorian(parseISO(t.startDate)).month)

function matchesDate(t: Tour, option: string, now: Date): boolean {
  if (option === ALL) return true
  const start = parseISO(t.startDate)
  const today = fromGregorian(now)
  const s = fromGregorian(start)
  if (option === 'این هفته') return start >= startOfDay(now) && start <= addDays(startOfDay(now), 7)
  const target = option === 'این ماه' ? { year: today.year, month: today.month } : shiftMonth({ year: today.year, month: today.month }, 1)
  return s.year === target.year && s.month === target.month
}

/** تورهای پیش‌رو + فیلترها، مرتب بر اساس نزدیک‌ترین تاریخ شروع */
export function selectTours(list: Tour[], organizers: TourOrganizer[], f: TourFilters, now: Date = new Date()): Tour[] {
  const orgName = new Map(organizers.map((o) => [o.id, o.name]))
  return publicTours(list, organizers, now)
    .filter((t) =>
      (f.season === ALL || tourSeason(t) === f.season) &&
      (f.scope === ALL || t.scope === (f.scope === 'داخلی' ? 'domestic' : 'international')) &&
      (f.type === ALL || t.tourType === f.type) &&
      (f.duration === ALL || t.duration === f.duration) &&
      (f.budget === ALL || t.budget === f.budget) &&
      (f.difficulty === ALL || t.difficulty === f.difficulty) &&
      (f.travelStyle === ALL || t.travelStyle === f.travelStyle) &&
      (f.suitableFor === ALL || (t.suitableFor as string[]).includes(f.suitableFor)) &&
      (f.organizer === ALL || orgName.get(t.organizerId) === f.organizer) &&
      matchesDate(t, f.date, now))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
}

const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' })
export const formatDate = (iso: string) => dateFmt.format(parseISO(iso))
export const formatPrice = (n: number) => `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
