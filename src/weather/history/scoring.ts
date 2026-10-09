// استفادهٔ موتور پیشنهاد از داده‌های تاریخی واقعی (جدا از پیش‌بینی آینده). بدون داده، امتیاز دست‌نویس مدیر استفاده می‌شود.
import type { SeasonClimate, SeasonKey } from '../../data/destinations'
import { HUMID, rainHumidityScore, temperatureScore } from '../../travel/weather'
import type { DestinationClimate } from './types'

const SEASON_DAYS = 91

/** امتیاز دما (۰ تا ۱۰۰) از میانگین دمای ثبت‌شدهٔ فصل؛ نزدیکی به ۲۳ درجه = امتیاز بیشتر */
export function measuredTemperatureScore(climate: DestinationClimate | undefined, key: SeasonKey, fallback: SeasonClimate): number {
  const t = climate?.stats.seasons[key]?.tempMean
  return t == null ? temperatureScore(fallback) : Math.max(0, 100 - Math.abs(t - 23) * 6)
}

/** امتیاز بارش/رطوبت: سهم روزهای بارانی فصل (اگر داده باشد) به‌جای سطح دست‌نویس بارندگی؛ رطوبت همچنان دست‌نویس */
export function measuredRainScore(climate: DestinationClimate | undefined, key: SeasonKey, fallback: SeasonClimate): number {
  const r = climate?.stats.seasons[key]?.rainyDays
  if (r == null) return rainHumidityScore(fallback)
  const rain = 100 - Math.min(100, (r / SEASON_DAYS) * 250)
  return rain * 0.6 + HUMID[fallback.humidity] * 0.4
}
