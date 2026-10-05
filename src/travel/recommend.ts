// موتور پیشنهاد سفر؛ فقط Rule-Based (بدون هوش مصنوعی، سرور یا تحلیل رفتار).
// مراحل: ۱) اعمال فیلترها ۲) امتیازدهی مقصدهای باقی‌مانده ۳) بخش‌بندی بر اساس فصل ۴) مرتب‌سازی نزولی.
import type { JalaliDate } from '../lib/jalali'
import type { Destination, Season } from '../data/destinations'
import { applyFilters, isFilterActive, matchesDestinationText, type TravelFilters } from './filters'
import { seasonOfMonth } from './season'

export const WEIGHTS = { season: 40, type: 25, budget: 15, duration: 10, destination: 10 } as const

export interface RecommendResult {
  season: Season
  /** مقصدهای مناسب فصل تاریخ انتخاب‌شده */
  suitable: Destination[]
  /** سایر مقصدهای قابل قبول (از فیلترها گذشته‌اند ولی فصل مناسبی نیست) */
  others: Destination[]
}

/** امتیاز فقط برای ترتیب داخلی است و به کاربر نمایش داده نمی‌شود */
export function scoreDestination(d: Destination, season: Season, f: TravelFilters): number {
  return (
    (d.best_seasons.includes(season) ? WEIGHTS.season : 0) +
    (isFilterActive(f.type) && d.type === f.type ? WEIGHTS.type : 0) +
    (isFilterActive(f.budget) && d.budget === f.budget ? WEIGHTS.budget : 0) +
    (isFilterActive(f.duration) && d.duration === f.duration ? WEIGHTS.duration : 0) +
    (f.destination.trim() && matchesDestinationText(d, f.destination) ? WEIGHTS.destination : 0)
  )
}

export function recommend(list: Destination[], input: { date: JalaliDate; filters: TravelFilters }): RecommendResult {
  const season = seasonOfMonth(input.date.month)
  const ranked = applyFilters(list, input.filters)
    .map((d) => ({ d, score: scoreDestination(d, season, input.filters) }))
    .sort((a, b) => b.score - a.score || a.d.id - b.d.id)
    .map((x) => x.d)

  return {
    season,
    suitable: ranked.filter((d) => d.best_seasons.includes(season)),
    others: ranked.filter((d) => !d.best_seasons.includes(season)),
  }
}

/** دلیل کوتاه پیشنهاد برای کارت */
export function reasonFor(d: Destination, season: Season): string {
  return d.best_seasons.includes(season)
    ? `${season} زمان مناسبی برای این سفر است؛ مناسب ${d.recommended_for[0]}.`
    : `${season} فصل مناسبی نیست؛ بهترین زمان: ${d.best_seasons.join('، ')}.`
}
