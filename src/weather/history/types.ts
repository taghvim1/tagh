import type { SeasonKey } from '../../data/destinations'

/** سری روزانهٔ خام Open-Meteo (Historical Weather)؛ مقدار null = نبود داده */
export interface DailySeries {
  time: string[]
  temperature_2m_mean: (number | null)[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
  precipitation_sum: (number | null)[]
  weather_code: (number | null)[]
}

/** آمار یک ماه یا یک فصل شمسی (میانگین روی سال‌های دورهٔ دریافت‌شده) */
export interface PeriodStats {
  /** تعداد روزهای دارای داده که در آمار دما به‌کار رفته */
  days: number
  tempMean: number | null
  /** میانگین دمای بیشینهٔ روزانه */
  tempMax: number | null
  /** میانگین دمای کمینهٔ روزانه */
  tempMin: number | null
  /** میانگین مجموع بارش یک دورهٔ کامل (ماه/فصل) به میلی‌متر؛ فقط از دوره‌های کامل */
  precipitationMm: number | null
  /** میانگین تعداد روزهای بارانی در یک دورهٔ کامل (روز با بارش ≥ RAINY_DAY_MM) */
  rainyDays: number | null
  /** پرتکرارترین کد وضعیت هوا */
  dominantCode: number | null
}

export interface ClimateStats {
  /** ۱۲ ماه شمسی (فروردین = اندیس ۰) */
  months: PeriodStats[]
  seasons: Record<SeasonKey, PeriodStats>
  rainyDayThresholdMm: number
}

/** نتیجهٔ ذخیره‌شده برای یک مقصد؛ داده‌های تاریخی، جدا از پیش‌بینی/آب‌وهوای فعلی */
export interface DestinationClimate {
  destinationId: number
  destinationName: string
  latitude: number
  longitude: number
  rangeStart: string
  rangeEnd: string
  fetchedAt: number
  stats: ClimateStats
}
