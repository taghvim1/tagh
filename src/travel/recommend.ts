// موتور پیشنهاد سفر (فصل و آب‌وهوا‌محور، Rule-Based، بدون AI/سرور/تحلیل رفتار).
// مراحل: ۱) فقط مقصدهای فعال ۲) فقط مقصدی که در فصل انتخاب‌شده آب‌وهوای مناسب دارد ۳) فیلترها
// ۴) مرتب‌سازی (تطابق بهترین فصل ← تناسب آب‌وهوا ← دما ← بارندگی/رطوبت ← کیفیت) ۵) جداسازی داخلی/خارجی با سقف ۱۰ مورد.
import type { Destination, Season } from '../data/destinations'
import { applyFilters, type TravelFilters } from './filters'
import { seasonKey } from './season'
import { RATING_SCORE, isSeasonSuitable, rainHumidityScore, temperatureScore } from './weather'

export const MAX_PER_SECTION = 10

export interface RecommendResult {
  season: Season
  domestic: Destination[]
  international: Destination[]
}

export function recommend(list: Destination[], input: { season: Season; filters: TravelFilters }): RecommendResult {
  const { season, filters } = input
  const key = seasonKey(season)
  const suitable = list.filter((d) => d.enabled && isSeasonSuitable(d.season_suitability[key]))

  const ranked = applyFilters(suitable, filters, season).sort((a, b) => {
    const ca = a.season_suitability[key]
    const cb = b.season_suitability[key]
    const match = (d: Destination) => Number(d.best_seasons.includes(season))
    return (
      match(b) - match(a) ||
      RATING_SCORE[cb.rating] - RATING_SCORE[ca.rating] ||
      temperatureScore(cb) - temperatureScore(ca) ||
      rainHumidityScore(cb) - rainHumidityScore(ca) ||
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
