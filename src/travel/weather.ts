// منطق آب‌وهوا برای موتور پیشنهاد: امتیاز تناسب فصلی، دما، بارندگی و رطوبت.
import type { Level, Rating, SeasonClimate } from '../data/destinations'

export const RATING_SCORE: Record<Rating, number> = { excellent: 100, good: 75, acceptable: 40, not_recommended: 0 }

/** شرایط حدی (بسیار گرم/سرد) حتی اگر مدیر امتیاز بالا داده باشد، مقصد را از پیشنهاد حذف می‌کند */
export const isExtreme = (c: SeasonClimate) => c.temperature_max >= 42 || c.temperature_min <= -10

/** فقط مقصدی که در فصل انتخاب‌شده واقعاً مناسب است (نه صرفاً برچسب فصل) */
export const isSeasonSuitable = (c: SeasonClimate) => c.rating !== 'not_recommended' && !isExtreme(c)

/** هرچه میانگین دما به محدودهٔ راحت (۲۳ درجه) نزدیک‌تر باشد، امتیاز بیشتر (۰ تا ۱۰۰) */
export const temperatureScore = (c: SeasonClimate) => Math.max(0, 100 - Math.abs(c.average_temperature - 23) * 6)

const RAIN: Record<Level, number> = { low: 100, medium: 70, high: 40 }
export const HUMID: Record<Level, number> = { low: 100, medium: 70, high: 40 }
/** بارندگی و رطوبت کمتر برای سفر راحت‌تر است */
export const rainHumidityScore = (c: SeasonClimate) => RAIN[c.rainfall] * 0.6 + HUMID[c.humidity] * 0.4

export type TemperatureBand = 'خنک' | 'معتدل' | 'گرم'
export const temperatureBand = (c: SeasonClimate): TemperatureBand => (c.average_temperature < 16 ? 'خنک' : c.average_temperature <= 27 ? 'معتدل' : 'گرم')
