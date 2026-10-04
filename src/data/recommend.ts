// موتور پیشنهاد سفر؛ فقط Rule-Based (بدون هوش مصنوعی، سرور یا تحلیل رفتار) روی داده‌های Mock.
import { destinationTerms, matchesDestination, type Destination, type Season } from './destinations'
import type { TravelFilters } from './travelFilters'

/** فصل بر اساس ماه شمسی (۱ تا ۱۲) */
const SEASON_BY_MONTH: Season[] = ['بهار', 'بهار', 'بهار', 'تابستان', 'تابستان', 'تابستان', 'پاییز', 'پاییز', 'پاییز', 'زمستان', 'زمستان', 'زمستان']
export const seasonOfMonth = (month: number): Season => SEASON_BY_MONTH[month - 1]

/** وزن امتیازها (فقط برای ترتیب نمایش؛ به کاربر نشان داده نمی‌شود) */
export const WEIGHTS = { season: 40, type: 25, budget: 15, duration: 10, destination: 10 } as const

export interface RecommendInput {
  season: Season
  filters: TravelFilters
}

export interface RecommendResult {
  /** مقصدهایی که فصل فعلی برایشان مناسب است */
  suitable: Destination[]
  /** مقصدهایی که فصل فعلی برایشان مناسب نیست */
  others: Destination[]
  /** مقصد وارد شده با هیچ مقصدی مطابقت ندارد */
  unknownDestination: boolean
}

interface Scored { d: Destination; seasonal: boolean; score: number; destMatch: boolean }

/**
 * بخش‌بندی فقط بر اساس فصل است؛ انتخاب‌های کاربر ترتیب داخل هر بخش را تعیین می‌کنند:
 * مقصدِ نام‌برده‌شده اول، بعد امتیاز نزولی، و در برابری ترتیب داده.
 */
export function recommend(list: Destination[], { season, filters }: RecommendInput): RecommendResult {
  const terms = destinationTerms(filters.destination)

  const scored: Scored[] = list.map((d) => {
    const seasonal = d.best_seasons.includes(season)
    const destMatch = terms.length > 0 && matchesDestination(d, terms)
    const score =
      (seasonal ? WEIGHTS.season : 0) +
      (filters.type && d.type === filters.type ? WEIGHTS.type : 0) +
      (filters.budget && d.budget === filters.budget ? WEIGHTS.budget : 0) +
      (filters.duration && d.duration === filters.duration ? WEIGHTS.duration : 0) +
      (destMatch ? WEIGHTS.destination : 0)
    return { d, seasonal, score, destMatch }
  })

  const byPriority = (a: Scored, b: Scored) => Number(b.destMatch) - Number(a.destMatch) || b.score - a.score || a.d.id - b.d.id

  return {
    suitable: scored.filter((x) => x.seasonal).sort(byPriority).map((x) => x.d),
    others: scored.filter((x) => !x.seasonal).sort(byPriority).map((x) => x.d),
    unknownDestination: terms.length > 0 && !scored.some((x) => x.destMatch),
  }
}
