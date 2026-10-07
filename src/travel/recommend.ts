// موتور پیشنهاد سفر (فصل‌محور، Rule-Based، بدون AI/سرور/تحلیل رفتار).
// ۱) فیلترها ۲) فقط مقصدهای مناسب فصل ۳) مرتب‌سازی بر اساس تناسب با فصل ۴) جداسازی داخلی/خارجی با سقف ۱۰ مورد.
import type { Destination, Season } from '../data/destinations'
import { applyFilters, type TravelFilters } from './filters'

export const MAX_PER_SECTION = 10

export interface RecommendResult {
  season: Season
  domestic: Destination[]
  international: Destination[]
}

/** هرچه مقصد در فصل‌های کمتری مناسب باشد، آن فصل برایش «اختصاصی‌تر» و تناسب بیشتر است (فقط برای ترتیب؛ نمایش داده نمی‌شود) */
export const seasonFit = (d: Destination) => 100 - (d.best_seasons.length - 1) * 10

export function recommend(list: Destination[], input: { season: Season; filters: TravelFilters }): RecommendResult {
  const { season, filters } = input
  const ranked = applyFilters(list, filters)
    .filter((d) => d.best_seasons.includes(season))
    .sort((a, b) => seasonFit(b) - seasonFit(a) || a.id - b.id)
  return {
    season,
    domestic: ranked.filter((d) => d.scope === 'domestic').slice(0, MAX_PER_SECTION),
    international: ranked.filter((d) => d.scope === 'international').slice(0, MAX_PER_SECTION),
  }
}

/** دلیل کوتاه پیشنهاد برای کارت */
export function reasonFor(d: Destination, season: Season): string {
  return d.best_seasons.length === 1
    ? `${season} بهترین فصل سفر به ${d.name} است.`
    : `${season} از زمان‌های مناسب سفر به ${d.name} است؛ مناسب ${d.recommended_for[0]}.`
}
