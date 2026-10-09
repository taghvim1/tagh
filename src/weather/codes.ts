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

export function weatherCodeIcon(code: number | null | undefined, isDay: boolean | null = true): string {
  if (code == null || !(code in TEXT)) return '🌡️'
  if (code === 0 || code === 1) return isDay === false ? '🌙' : code === 0 ? '☀️' : '🌤️'
  if (code === 2) return isDay === false ? '☁️' : '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if (code === 85 || code === 86) return '🌨️'
  if (code >= 71 && code <= 77) return '❄️'
  return '⛈️'
}

export class WeatherError extends Error {
  /** retriable: خطای موقت (شبکه، ۵xx، محدودیت نرخ) که تلاش مجدد دارد */
  constructor(public kind: 'network' | 'rate' | 'http' | 'format', message: string, public retriable = false) { super(message) }
}

export const finiteOrNull = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
