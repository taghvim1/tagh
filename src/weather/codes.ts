// کدهای وضعیت هوا (WMO) در Open-Meteo → توضیح فارسی و نماد. کد ناشناخته = null (چیزی حدس زده نمی‌شود).
const TEXT: Record<number, string> = {
  0: 'آسمان صاف', 1: 'عمدتاً صاف', 2: 'نیمه‌ابری', 3: 'ابری', 45: 'مه', 48: 'مه یخ‌زده',
  51: 'نم‌نم باران سبک', 53: 'نم‌نم باران', 55: 'نم‌نم باران شدید', 56: 'نم‌نم یخ‌زده', 57: 'نم‌نم یخ‌زدهٔ شدید',
  61: 'باران سبک', 63: 'باران', 65: 'باران شدید', 66: 'باران یخ‌زده', 67: 'باران یخ‌زدهٔ شدید',
  71: 'برف سبک', 73: 'برف', 75: 'برف سنگین', 77: 'دانه‌های برف',
  80: 'رگبار سبک', 81: 'رگبار', 82: 'رگبار شدید', 85: 'رگبار برف', 86: 'رگبار برف شدید',
  95: 'رعدوبرق', 96: 'رعدوبرق با تگرگ', 99: 'رعدوبرق با تگرگ شدید',
}

export const weatherCodeText = (code: number | null | undefined): string | null => (code == null ? null : TEXT[code] ?? null)

/** نام آیکون خطی هر وضعیت هوا (فایل‌های src/weather/icons)؛ کد ناشناخته = null و آیکونی نمایش داده نمی‌شود */
export type WeatherIconName = 'sun' | 'clouds' | 'moon-cloud' | 'moon-stars' | 'rain' | 'drizzle' | 'showers' | 'snow' | 'snowflakes' | 'thunder' | 'thunder-rain' | 'fog'

export function weatherIconName(code: number | null | undefined, isDay: boolean | null = true): WeatherIconName | null {
  if (code == null || !(code in TEXT)) return null
  const night = isDay === false
  if (code === 0 || code === 1) return night ? 'moon-stars' : 'sun'
  if (code === 2) return night ? 'moon-cloud' : 'clouds'
  if (code === 3) return 'clouds'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code === 65 || code === 67 || (code >= 80 && code <= 82)) return 'showers'
  if (code >= 61 && code <= 66) return 'rain'
  if (code === 75 || code === 85 || code === 86) return 'snowflakes'
  if (code >= 71 && code <= 77) return 'snow'
  if (code === 96 || code === 99) return 'thunder-rain'
  return 'thunder'
}

export class WeatherError extends Error {
  /** retriable: خطای موقت (شبکه، ۵xx، محدودیت نرخ) که تلاش مجدد دارد */
  constructor(public kind: 'network' | 'rate' | 'http' | 'format', message: string, public retriable = false) { super(message) }
}

export const finiteOrNull = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
