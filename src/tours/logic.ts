// منطق تورها (جدا از UI): تاریخ، مدت، پیش‌رو بودن و فیلترها.
import { DURATIONS } from '../data/destinations'
import { fromGregorian, shiftMonth } from '../lib/jalali'
import { seasonOfMonth } from '../travel/season'
import { DIFFICULTIES, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, type Tour } from './types'

export const ALL = 'همه'
export const SEASON_OPTIONS = [ALL, 'بهار', 'تابستان', 'پاییز', 'زمستان'] as const
export const SCOPE_OPTIONS = [ALL, 'داخلی', 'خارجی'] as const
export const TYPE_OPTIONS = [ALL, ...TOUR_TYPES] as const
export const DURATION_OPTIONS = [ALL, ...DURATIONS] as const
export const BUDGET_OPTIONS = [ALL, ...TOUR_BUDGETS] as const
export const DIFFICULTY_OPTIONS = [ALL, ...DIFFICULTIES] as const
export const COMPANION_OPTIONS = [ALL, ...TOUR_COMPANIONS] as const
export const DATE_OPTIONS = [ALL, 'این هفته', 'این ماه', 'ماه بعد'] as const

export interface TourFilters { season: string; scope: string; type: string; duration: string; budget: string; difficulty: string; companion: string; date: string }
export const EMPTY_TOUR_FILTERS: TourFilters = { season: ALL, scope: ALL, type: ALL, duration: ALL, budget: ALL, difficulty: ALL, companion: ALL, date: ALL }
export const activeTourFilterCount = (f: TourFilters) => Object.values(f).filter((v) => v !== ALL).length

const DAY = 86_400_000
export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12) }
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)

/** تعداد روزهای تور (شامل روز اول و آخر) */
export const tourDays = (start: string, end: string) => Math.max(1, Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / DAY) + 1)
export const durationLabel = (days: number): Tour['duration'] => (days <= 1 ? 'یک روزه' : days <= 3 ? '۲ تا ۳ روز' : days <= 7 ? '۴ تا ۷ روز' : 'بیش از یک هفته')
export const withDuration = (t: Tour): Tour => ({ ...t, duration: durationLabel(tourDays(t.start_date, t.end_date)) })

/** فقط تورهای پیش‌رو: فعال، وضعیت «پیش‌رو» و تاریخ شروع از امروز به بعد */
export const isUpcoming = (t: Tour, now: Date) => t.enabled && t.status === 'upcoming' && parseISO(t.start_date) >= startOfDay(now)

export const tourSeason = (t: Tour) => seasonOfMonth(fromGregorian(parseISO(t.start_date)).month)

function matchesDate(t: Tour, option: string, now: Date): boolean {
  if (option === ALL) return true
  const start = parseISO(t.start_date)
  const today = fromGregorian(now)
  const s = fromGregorian(start)
  if (option === 'این هفته') return start >= startOfDay(now) && start <= addDays(startOfDay(now), 7)
  const target = option === 'این ماه' ? { year: today.year, month: today.month } : shiftMonth({ year: today.year, month: today.month }, 1)
  return s.year === target.year && s.month === target.month
}

/** تورهای پیش‌رو + فیلترها، مرتب بر اساس نزدیک‌ترین تاریخ شروع */
export function selectTours(list: Tour[], f: TourFilters, now: Date = new Date()): Tour[] {
  return list
    .filter((t) => isUpcoming(t, now))
    .filter((t) =>
      (f.season === ALL || tourSeason(t) === f.season) &&
      (f.scope === ALL || t.scope === (f.scope === 'داخلی' ? 'domestic' : 'international')) &&
      (f.type === ALL || t.tour_type === f.type) &&
      (f.duration === ALL || t.duration === f.duration) &&
      (f.budget === ALL || t.budget === f.budget) &&
      (f.difficulty === ALL || t.difficulty === f.difficulty) &&
      (f.companion === ALL || (t.companions as string[]).includes(f.companion)) &&
      matchesDate(t, f.date, now))
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id)
}

const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' })
export const formatDate = (iso: string) => dateFmt.format(parseISO(iso))
export const formatPrice = (n: number) => `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
