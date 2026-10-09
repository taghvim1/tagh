// دریافت داده‌های تاریخی از Open-Meteo Historical Weather API (بدون کلید API)
import { WeatherError, finiteOrNull } from '../codes'
import type { DailySeries } from './types'

const ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive'
export const DAILY_VARS = ['temperature_2m_mean', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weather_code'] as const

/** پنج سال میلادی کامل اخیر: از ۱ ژانویهٔ پنج سال قبل تا ۳۱ دسامبر سال گذشته (پویا نسبت به امروز) */
export function historyRange(now: Date = new Date()) {
  const y = now.getFullYear()
  return { start: `${y - 5}-01-01`, end: `${y - 1}-12-31` }
}

export function buildArchiveUrl(lat: number, lon: number, start: string, end: string): string {
  const p = new URLSearchParams({ latitude: String(lat), longitude: String(lon), start_date: start, end_date: end, daily: DAILY_VARS.join(','), timezone: 'auto' })
  return `${ENDPOINT}?${p}`
}

export function parseArchive(json: unknown): DailySeries {
  const daily = (json as { daily?: Record<string, unknown> } | null)?.daily
  const time = daily?.time
  if (!daily || !Array.isArray(time) || time.length === 0) throw new WeatherError('format', 'پاسخ تاریخی نامعتبر است.')
  const col = (k: string) => {
    const v = daily[k]
    if (!Array.isArray(v) || v.length !== time.length) throw new WeatherError('format', `ستون ${k} نامعتبر است.`)
    return v.map(finiteOrNull)
  }
  return { time: time.map(String), temperature_2m_mean: col('temperature_2m_mean'), temperature_2m_max: col('temperature_2m_max'), temperature_2m_min: col('temperature_2m_min'), precipitation_sum: col('precipitation_sum'), weather_code: col('weather_code') }
}

export async function fetchArchive(lat: number, lon: number, start: string, end: string, fetchImpl: typeof fetch = fetch): Promise<DailySeries> {
  let res: Response
  try { res = await fetchImpl(buildArchiveUrl(lat, lon, start, end), { signal: AbortSignal.timeout(30_000) }) } catch { throw new WeatherError('network', 'اتصال به سرویس آب‌وهوا برقرار نشد.', true) }
  if (res.status === 429) throw new WeatherError('rate', 'محدودیت تعداد درخواست.', true)
  if (!res.ok) throw new WeatherError('http', `خطای سرویس (${res.status}).`, res.status >= 500)
  try { return parseArchive(await res.json()) } catch (e) { throw e instanceof WeatherError ? e : new WeatherError('format', 'پاسخ تاریخی نامعتبر است.') }
}
