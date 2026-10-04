// موتور پیشنهاد سفر؛ فقط Rule-Based (بدون هوش مصنوعی، سرور یا تحلیل رفتار) روی داده‌های Mock.
import { destinationTerms, matchesDestination, type Destination, type Season } from './destinations'
import type { TravelFilters } from './travelFilters'

/** فصل بر اساس ماه شمسی (۱ تا ۱۲) */
const SEASON_BY_MONTH: Season[] = ['بهار', 'بهار', 'بهار', 'تابستان', 'تابستان', 'تابستان', 'پاییز', 'پاییز', 'پاییز', 'زمستان', 'زمستان', 'زمستان']
export const seasonOfMonth = (month: number): Season => SEASON_BY_MONTH[month - 1]

export const WEIGHTS = { season: 40, type: 25, budget: 15, duration: 10, destination: 10 } as const
/** حداقل نسبت امتیاز به حداکثر امتیازِ ممکن برای قرار گرفتن در «پیشنهادهای مناسب» */
export const RECOMMENDED_RATIO = 0.7

export interface RecommendInput {
  season: Season
  filters: TravelFilters
}

export interface RecommendResult {
  recommended: Destination[]
  others: Destination[]
  /** مقصد وارد شده با هیچ مقصدی مطابقت ندارد */
  unknownDestination: boolean
}

interface Scored { d: Destination; score: number; ratio: number; destMatch: boolean }

export function recommend(list: Destination[], { season, filters }: RecommendInput): RecommendResult {
  const terms = destinationTerms(filters.destination)
  // حداکثر امتیاز ممکن فقط از فیلترهای فعال (و فصل) ساخته می‌شود
  const max = WEIGHTS.season + (filters.type ? WEIGHTS.type : 0) + (filters.budget ? WEIGHTS.budget : 0) + (filters.duration ? WEIGHTS.duration : 0) + (terms.length ? WEIGHTS.destination : 0)

  const scored: Scored[] = list.map((d) => {
    const destMatch = terms.length > 0 && matchesDestination(d, terms)
    const score =
      (d.best_seasons.includes(season) ? WEIGHTS.season : 0) +
      (filters.type && d.type === filters.type ? WEIGHTS.type : 0) +
      (filters.budget && d.budget === filters.budget ? WEIGHTS.budget : 0) +
      (filters.duration && d.duration === filters.duration ? WEIGHTS.duration : 0) +
      (destMatch ? WEIGHTS.destination : 0)
    return { d, score, ratio: score / max, destMatch }
  }).filter((x) => x.score > 0)

  // مقصدِ انتخاب‌شده در اولویت است؛ سپس امتیاز نزولی؛ در برابری، ترتیب داده
  const byPriority = (a: Scored, b: Scored) => Number(b.destMatch) - Number(a.destMatch) || b.score - a.score || a.d.id - b.d.id
  const isRecommended = (x: Scored) => x.destMatch || x.ratio >= RECOMMENDED_RATIO

  return {
    recommended: scored.filter(isRecommended).sort(byPriority).map((x) => x.d),
    others: scored.filter((x) => !isRecommended(x)).sort(byPriority).map((x) => x.d),
    unknownDestination: terms.length > 0 && !scored.some((x) => x.destMatch),
  }
}
