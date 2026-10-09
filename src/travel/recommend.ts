// موتور پیشنهاد سفر (فصل و آب‌وهوا‌محور، Rule-Based، بدون AI/سرور/تحلیل رفتار).
// مراحل: ۱) فقط مقصدهای فعال ۲) فقط مقصدی که در فصل انتخاب‌شده آب‌وهوای مناسب دارد ۳) فیلترها
// ۴) مرتب‌سازی (تطابق بهترین فصل ← تناسب آب‌وهوا ← دما ← بارندگی/رطوبت ← کیفیت؛ دما و بارش از داده‌های تاریخی واقعی در صورت وجود) ۵) جداسازی داخلی/خارجی با سقف ۱۰ مورد.
import type { Destination, Season } from '../data/destinations'
import { applyFilters, type TravelFilters } from './filters'
import { seasonKey } from './season'
import type { DestinationClimate } from '../weather/history/types'
import { measuredRainScore, measuredTemperatureScore } from '../weather/history/scoring'
import { RATING_SCORE, isSeasonSuitable } from './weather'

export const MAX_PER_SECTION = 10

export interface RecommendResult {
  season: Season
  domestic: Destination[]
  international: Destination[]
}

/** climate (اختیاری): آمار تاریخی واقعی هر مقصد؛ در صورت وجود، دما و بارش اندازه‌گیری‌شده جایگزین عدد دست‌نویس می‌شود */
export function recommend(list: Destination[], input: { season: Season; filters: TravelFilters; climate?: Record<number, DestinationClimate> }): RecommendResult {
  const { season, filters, climate } = input
  const key = seasonKey(season)
  const suitable = list.filter((d) => d.enabled && isSeasonSuitable(d.season_suitability[key]))

  const ranked = applyFilters(suitable, filters, season).sort((a, b) => {
    const ca = a.season_suitability[key]
    const cb = b.season_suitability[key]
    const match = (d: Destination) => Number(d.best_seasons.includes(season))
    return (
      match(b) - match(a) ||
      RATING_SCORE[cb.rating] - RATING_SCORE[ca.rating] ||
      measuredTemperatureScore(climate?.[b.id], key, cb) - measuredTemperatureScore(climate?.[a.id], key, ca) ||
      measuredRainScore(climate?.[b.id], key, cb) - measuredRainScore(climate?.[a.id], key, ca) ||
      b.quality + cb.priority - (a.quality + ca.priority) ||
      a.id - b.id
    )
  })

  return {
    season,
    domestic: ranked.filter((d) => d.scope === 'domestic').slice(0, MAX_PER_SECTION),
    international: ranked.filter((d) => d.scope === 'international').slice(0, MAX_PER_SECTION),
  }
}
