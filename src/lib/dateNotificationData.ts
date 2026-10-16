import { weatherIconName, type WeatherIconName } from '../weather/codes'
import type { WeatherState } from '../weather/current/store'

export interface NotifWeather { icon: WeatherIconName; temp: number }
const sameLocalDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()
export const localDayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
export const isoDay = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const hourKey = (t: number) => String(new Date(t).getHours()).padStart(2, '0')
const FRESH_MS = 3 * 3600_000

/**
 * دمای «همین ساعت» (نه میانگین روز): از پیش‌بینی ساعتیِ ذخیره‌شده؛ اگر ساعت فعلی در آن نبود، دمای فعلیِ تازه (کمتر از ۳ ساعت).
 * اگر هیچ‌کدام نبود چیزی ساخته نمی‌شود (مقدار ساختگی/کهنه نمایش داده نمی‌شود).
 */
export function notificationWeather(s: Pick<WeatherState, 'weather' | 'updatedAt'>, now = Date.now()): NotifWeather | null {
  const w = s.weather
  if (!w) return null
  const slot = `${isoDay(now)}T${hourKey(now)}:00`
  const h = w.hourly?.find((x) => x.time === slot)
  if (h && h.temperature != null) {
    const icon = weatherIconName(h.weatherCode, h.isDay)
    if (icon) return { icon, temp: Math.round(h.temperature) }
  }
  if (s.updatedAt == null || now - s.updatedAt > FRESH_MS || now < s.updatedAt || w.temperature == null) return null
  const icon = weatherIconName(w.weatherCode, w.isDay)
  return icon ? { icon, temp: Math.round(w.temperature) } : null
}
/** دمای هر ساعتِ پیش‌بینی ساعتی، به‌تفکیک روز و ساعت (برای Service Worker تا بدون باز شدن برنامه هم دمای همان ساعت را بگذارد) */
export function hourlyPlan(w: WeatherState['weather']): Record<string, Record<string, NotifWeather>> {
  const out: Record<string, Record<string, NotifWeather>> = {}
  for (const h of w?.hourly ?? []) {
    if (h.temperature == null || !/^\d{4}-\d{2}-\d{2}T\d{2}:/.test(h.time)) continue
    const icon = weatherIconName(h.weatherCode, h.isDay)
    if (!icon) continue
    ;(out[h.time.slice(0, 10)] ??= {})[h.time.slice(11, 13)] = { icon, temp: Math.round(h.temperature) }
  }
  return out
}
export const weatherSignature = (n: NotifWeather | null) => (n ? `${n.icon}|${n.temp}` : '')

/** متن دما کنار تاریخ در عنوان اعلان: «دما °۲۲» */
export const tempLabel = (t: number) => `دما ${t < 0 ? '−' : ''}°${Math.abs(t).toLocaleString('fa-IR', { useGrouping: false })}`
export const notificationTitle = (dateTitle: string, t: number | null) => (t === null ? dateTitle : `${dateTitle}   ·   ${tempLabel(t)}`)
