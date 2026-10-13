import { weatherIconName, type WeatherIconName } from '../weather/codes'
import type { WeatherState } from '../weather/current/store'

export interface NotifWeather { icon: WeatherIconName; avg: number }
const sameLocalDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()
export const localDayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
export const isoDay = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

/**
 * میانگین روز = (حداکثر + حداقل) / ۲ پیش‌بینی «امروز».
 * اگر پیش‌بینی ده‌روزهٔ ذخیره‌شده ردیفی برای امروز دارد از همان استفاده می‌شود (حتی اگر دیروز دریافت شده)، وگرنه فقط دادهٔ همین امروز؛
 * اگر هیچ‌کدام نبود چیزی ساخته نمی‌شود (مقدار ساختگی/کهنه نمایش داده نمی‌شود).
 */
export function notificationWeather(s: Pick<WeatherState, 'weather' | 'updatedAt'>, now = Date.now()): NotifWeather | null {
  const w = s.weather
  if (!w) return null
  const today = w.daily?.find((d) => d.date === isoDay(now))
  if (today) {
    if (today.tempMax == null || today.tempMin == null) return null
    const icon = weatherIconName(today.weatherCode, true)
    return icon ? { icon, avg: Math.round((today.tempMax + today.tempMin) / 2) } : null
  }
  if (s.updatedAt == null || !sameLocalDay(s.updatedAt, now)) return null
  if (w.tempMax == null || w.tempMin == null) return null
  const icon = weatherIconName(w.weatherCode, w.isDay)
  return icon ? { icon, avg: Math.round((w.tempMax + w.tempMin) / 2) } : null
}
/** ردیف هر روزِ پیش‌بینی ده‌روزه (برای ذخیرهٔ طرح روزها تا Service Worker بدون باز شدن برنامه هم دمای همان روز را بگذارد) */
export function dailyPlan(w: WeatherState['weather']): Array<{ date: string; weather: NotifWeather }> {
  return (w?.daily ?? []).flatMap((d) => {
    if (d.tempMax == null || d.tempMin == null) return []
    const icon = weatherIconName(d.weatherCode, true)
    return icon ? [{ date: d.date, weather: { icon, avg: Math.round((d.tempMax + d.tempMin) / 2) } }] : []
  })
}
export const weatherSignature = (n: NotifWeather | null) => (n ? `${n.icon}|${n.avg}` : '')

/** متن دما کنار تاریخ در عنوان اعلان: «دما °۲۲» */
export const tempLabel = (avg: number) => `دما ${avg < 0 ? '−' : ''}°${Math.abs(avg).toLocaleString('fa-IR', { useGrouping: false })}`
export const notificationTitle = (dateTitle: string, avg: number | null) => (avg === null ? dateTitle : `${dateTitle}   ·   ${tempLabel(avg)}`)
