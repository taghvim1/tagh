/** آب‌وهوای فعلی + پیش‌بینی امروز؛ جدا از داده‌های تاریخی مقصدها */
export interface CurrentWeather {
  temperature: number | null
  apparentTemperature: number | null
  humidity: number | null
  isDay: boolean | null
  precipitation: number | null
  weatherCode: number | null
  /** کیلومتر بر ساعت */
  windSpeed: number | null
  tempMax: number | null
  tempMin: number | null
  /** درصد */
  precipitationProbability: number | null
  /** ISO محلیِ منطقهٔ زمانیِ مختصات (طبق timezone=auto) */
  sunrise: string | null
  sunset: string | null
  timezone: string | null
  /** جزئیات اضافهٔ فعلی (ممکن است در دادهٔ ذخیره‌شدهٔ قدیمی نباشد) */
  windGusts?: number | null
  windDirection?: number | null
  cloudCover?: number | null
  pressure?: number | null
  /** شاخص کیفیت هوا (US AQI)؛ اگر سرویس کیفیت هوا در دسترس نبود نیست */
  aqi?: number | null
  /** پیش‌بینی ده روز آینده (از امروز) */
  daily?: DailyForecast[]
  /** پیش‌بینی ساعتی ۷۲ ساعت آینده */
  hourly?: HourlyForecast[]
}

export interface DailyForecast {
  /** YYYY-MM-DD محلیِ مختصات */
  date: string
  weatherCode: number | null
  tempMax: number | null
  tempMin: number | null
  apparentMax: number | null
  apparentMin: number | null
  /** میلی‌متر */
  precipitationSum: number | null
  precipitationProbability: number | null
  /** کیلومتر بر ساعت */
  windMax: number | null
  gustMax: number | null
  uvMax: number | null
  /** میانگین روز از دادهٔ ساعتی (ممکن است در دادهٔ ذخیره‌شدهٔ قدیمی نباشد) */
  humidity?: number | null
  pressure?: number | null
  visibility?: number | null
  cloudCover?: number | null
  windDirection?: number | null
  aqi?: number | null
  sunrise: string | null
  sunset: string | null
}

export interface HourlyForecast {
  /** YYYY-MM-DDTHH:00 محلیِ مختصات */
  time: string
  temperature: number | null
  apparent: number | null
  weatherCode: number | null
  isDay: boolean | null
  precipitationProbability: number | null
  /** میلی‌متر */
  precipitation: number | null
  humidity: number | null
  windSpeed: number | null
  windGusts: number | null
  windDirection: number | null
  cloudCover: number | null
  uv: number | null
  /** متر */
  visibility: number | null
  pressure?: number | null
  aqi?: number | null
}

export type CurrentWeatherError = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'network' | 'api'
