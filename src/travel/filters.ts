// فیلترهای پیشرفتهٔ پیشنهاد سفر (جدا از موتور و UI): گزینه‌ها، مقدار پیش‌فرض و اعمال فیلتر.
import { BUDGETS, COMPANIONS, DURATIONS, TRAVEL_TYPES, type Destination } from '../data/destinations'

export const ALL = 'همه'
export const SCOPE_OPTIONS = [ALL, 'داخلی', 'خارجی'] as const
export const BUDGET_OPTIONS = [ALL, ...BUDGETS] as const
export const TYPE_OPTIONS = [ALL, ...TRAVEL_TYPES] as const
export const DURATION_OPTIONS = [ALL, ...DURATIONS] as const
export const COMPANION_OPTIONS = [ALL, ...COMPANIONS] as const
export const VISA_OPTIONS = [ALL, 'بدون نیاز به ویزا', 'نیازمند ویزا'] as const

export interface TravelFilters {
  query: string // جستجوی شهر یا کشور
  scope: string
  budget: string
  type: string
  duration: string
  companion: string
  visa: string
}

export const EMPTY_FILTERS: TravelFilters = { query: '', scope: ALL, budget: ALL, type: ALL, duration: ALL, companion: ALL, visa: ALL }

const isActive = (v: string) => v !== ALL && v !== ''
const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, '').trim().toLowerCase()

/** جستجو روی نام، کشور، استان/شهر و نوع سفر؛ چند عبارت با «،» یا «,» (هرکدام کافی است) */
export function matchesQuery(d: Destination, query: string): boolean {
  const terms = query.split(/[،,]/).map(normalize).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = normalize(`${d.name} ${d.country} ${d.province_or_city} ${d.type.join(' ')}`)
  return terms.some((t) => haystack.includes(t))
}

// مقصد داخلی برای شهروند ایرانی ویزا ندارد (visa_required = null)
const needsVisa = (d: Destination) => d.visa_required === true

/** همهٔ فیلترهای انتخاب‌شده همزمان اعمال می‌شوند (AND) */
export function applyFilters(list: Destination[], f: TravelFilters): Destination[] {
  return list.filter(
    (d) =>
      (!isActive(f.scope) || d.scope === (f.scope === 'داخلی' ? 'domestic' : 'international')) &&
      (!isActive(f.budget) || d.budget === f.budget) &&
      (!isActive(f.type) || (d.type as string[]).includes(f.type)) &&
      (!isActive(f.duration) || d.duration === f.duration) &&
      (!isActive(f.companion) || (d.companions as string[]).includes(f.companion)) &&
      (!isActive(f.visa) || needsVisa(d) === (f.visa === 'نیازمند ویزا')) &&
      matchesQuery(d, f.query),
  )
}

/** خلاصهٔ فیلترهای فعال به شکل [برچسب، مقدار] */
export function summarize(f: TravelFilters): [string, string][] {
  const rows: [string, string][] = [['جستجو', f.query.trim()], ['نوع مقصد', f.scope], ['بودجه', f.budget], ['نوع سفر', f.type], ['مدت سفر', f.duration], ['مناسب برای', f.companion], ['ویزا', f.visa]]
  return rows.filter(([, v]) => isActive(v))
}

export const activeFilterCount = (f: TravelFilters) => summarize(f).length
