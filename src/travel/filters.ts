// فیلترهای پیشرفتهٔ پیشنهاد سفر (جدا از موتور و UI): گزینه‌ها، مقدار پیش‌فرض و اعمال فیلتر.
import { BUDGETS, COMPANIONS, DURATIONS, LEVEL_LABEL, RATING_LABEL, TRAVEL_TYPES, type Destination, type Season } from '../data/destinations'
import { seasonKey } from './season'
import { temperatureBand } from './weather'

export const ALL = 'همه'
export const SCOPE_OPTIONS = [ALL, 'داخلی', 'خارجی'] as const
export const BUDGET_OPTIONS = [ALL, ...BUDGETS] as const
export const TYPE_OPTIONS = [ALL, ...TRAVEL_TYPES] as const
export const DURATION_OPTIONS = [ALL, ...DURATIONS] as const
export const COMPANION_OPTIONS = [ALL, ...COMPANIONS] as const
export const SUITABILITY_OPTIONS = [ALL, 'عالی', 'مناسب', 'قابل قبول'] as const
export const TEMPERATURE_OPTIONS = [ALL, 'خنک', 'معتدل', 'گرم'] as const
export const RAINFALL_OPTIONS = [ALL, 'کم', 'متوسط', 'زیاد'] as const
export const VISA_OPTIONS = [ALL, 'بدون نیاز به ویزا', 'نیازمند ویزا'] as const

export interface TravelFilters {
  query: string
  scope: string
  budget: string
  type: string
  duration: string
  companion: string
  suitability: string
  temperature: string
  rainfall: string
  visa: string
}

export const EMPTY_FILTERS: TravelFilters = { query: '', scope: ALL, budget: ALL, type: ALL, duration: ALL, companion: ALL, suitability: ALL, temperature: ALL, rainfall: ALL, visa: ALL }

const isActive = (v: string) => v !== ALL && v !== ''
const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, '').trim().toLowerCase()

/** جستجو روی نام، کشور، استان/شهر و نوع سفر؛ چند عبارت با «،» یا «,» (هرکدام کافی است) */
export function matchesQuery(d: Destination, query: string): boolean {
  const terms = query.split(/[،,]/).map(normalize).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = normalize(`${d.name} ${d.country} ${d.province_or_city} ${d.type.join(' ')}`)
  return terms.some((t) => haystack.includes(t))
}

/** همهٔ فیلترها همزمان اعمال می‌شوند (AND)؛ فیلترهای آب‌وهوایی روی پارامترهای فصل انتخاب‌شده کار می‌کنند */
export function applyFilters(list: Destination[], f: TravelFilters, season: Season): Destination[] {
  const key = seasonKey(season)
  return list.filter((d) => {
    const climate = d.season_suitability[key]
    return (
      (!isActive(f.scope) || d.scope === (f.scope === 'داخلی' ? 'domestic' : 'international')) &&
      (!isActive(f.budget) || d.budget === f.budget) &&
      (!isActive(f.type) || (d.type as string[]).includes(f.type)) &&
      (!isActive(f.duration) || d.duration === f.duration) &&
      (!isActive(f.companion) || (d.companions as string[]).includes(f.companion)) &&
      (!isActive(f.suitability) || RATING_LABEL[climate.rating] === f.suitability) &&
      (!isActive(f.temperature) || temperatureBand(climate) === f.temperature) &&
      (!isActive(f.rainfall) || LEVEL_LABEL[climate.rainfall] === f.rainfall) &&
      // مقصد داخلی برای شهروند ایرانی ویزا ندارد (visa_required = null)
      (!isActive(f.visa) || (d.visa_required === true) === (f.visa === 'نیازمند ویزا')) &&
      matchesQuery(d, f.query)
    )
  })
}

const LABELS: [keyof TravelFilters, string][] = [['query', 'جستجو'], ['scope', 'نوع مقصد'], ['budget', 'بودجه'], ['type', 'نوع سفر'], ['duration', 'مدت سفر'], ['companion', 'مناسب برای'], ['suitability', 'تناسب آب‌وهوا'], ['temperature', 'دما'], ['rainfall', 'بارندگی'], ['visa', 'ویزا']]
/** خلاصهٔ فیلترهای فعال به شکل [برچسب، مقدار] */
export const summarize = (f: TravelFilters): [string, string][] => LABELS.map(([k, label]) => [label, f[k].trim()] as [string, string]).filter(([, v]) => isActive(v))
export const activeFilterCount = (f: TravelFilters) => summarize(f).length
