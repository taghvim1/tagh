// فیلترهای پیشنهاد سفر (جدا از موتور امتیازدهی): گزینه‌ها، مقدار پیش‌فرض و اعمال فیلتر روی فهرست مقصدها.
import { BUDGETS, DURATIONS, TRIP_TYPES, type Destination } from '../data/destinations'

export const ALL = 'همه'
export const SCOPE_OPTIONS = [ALL, 'داخلی', 'خارجی'] as const
export const TYPE_OPTIONS = [ALL, ...TRIP_TYPES] as const
export const DURATION_OPTIONS = [ALL, ...DURATIONS] as const
export const BUDGET_OPTIONS = [ALL, ...BUDGETS] as const

export interface TravelFilters {
  destination: string // متن آزاد (نام شهر یا کشور)
  scope: string
  type: string
  duration: string
  budget: string
}

export const EMPTY_FILTERS: TravelFilters = { destination: '', scope: ALL, type: ALL, duration: ALL, budget: ALL }

const SCOPE_VALUE: Record<string, Destination['scope']> = { 'داخلی': 'domestic', 'خارجی': 'international' }
const isActive = (value: string) => value !== ALL && value !== ''

const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, '').trim().toLowerCase()
/** عبارت‌های مقصد؛ چند عبارت را می‌توان با «،» یا «,» جدا کرد (هرکدام کافی است) */
const destinationTerms = (text: string) => text.split(/[،,]/).map(normalize).filter(Boolean)

export function matchesDestinationText(d: Destination, text: string): boolean {
  const terms = destinationTerms(text)
  if (terms.length === 0) return true
  const haystack = normalize(`${d.name} ${d.province_or_city} ${d.country} ${d.description}`)
  return terms.some((t) => haystack.includes(t))
}

/** همهٔ فیلترهای انتخاب‌شده همزمان اعمال می‌شوند (AND) */
export function applyFilters(list: Destination[], f: TravelFilters): Destination[] {
  return list.filter(
    (d) =>
      (!isActive(f.scope) || d.scope === SCOPE_VALUE[f.scope]) &&
      (!isActive(f.type) || d.type === f.type) &&
      (!isActive(f.duration) || d.duration === f.duration) &&
      (!isActive(f.budget) || d.budget === f.budget) &&
      matchesDestinationText(d, f.destination),
  )
}

export const isFilterActive = isActive

/** خلاصهٔ فیلترهای انتخاب‌شده به شکل [برچسب، مقدار] */
export function summarize(f: TravelFilters): [string, string][] {
  const rows: [string, string][] = [['مقصد', f.destination.trim()], ['نوع مقصد', f.scope], ['نوع سفر', f.type], ['مدت سفر', f.duration], ['بودجه', f.budget]]
  return rows.filter(([, value]) => isActive(value))
}
