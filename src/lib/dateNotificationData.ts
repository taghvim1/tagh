import { weatherIconName, type WeatherIconName } from '../weather/codes'
import type { WeatherState } from '../weather/current/store'

export interface NotifWeather { icon: WeatherIconName; avg: number }
const sameLocalDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

/** میانگین روز = (حداکثر + حداقل) / ۲ از پیش‌بینی امروز. اگر داده نبود یا مربوط به امروز نبود، هیچ‌چیز ساخته نمی‌شود (مقدار ساختگی/کهنه نمایش داده نمی‌شود). */
export function notificationWeather(s: Pick<WeatherState, 'weather' | 'updatedAt'>, now = Date.now()): NotifWeather | null {
  const w = s.weather
  if (!w || s.updatedAt == null || !sameLocalDay(s.updatedAt, now)) return null
  if (w.tempMax == null || w.tempMin == null) return null
  const icon = weatherIconName(w.weatherCode, w.isDay)
  return icon ? { icon, avg: Math.round((w.tempMax + w.tempMin) / 2) } : null
}
export const weatherSignature = (n: NotifWeather | null) => (n ? `${n.icon}|${n.avg}` : '')
export const localDayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
