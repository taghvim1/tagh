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
}

export type CurrentWeatherError = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'network' | 'api'
