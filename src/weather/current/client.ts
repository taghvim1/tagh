// آب‌وهوای فعلی از Open-Meteo Forecast API (بدون کلید API)
import { WeatherError, finiteOrNull } from '../codes'
import type { CurrentWeather } from './types'

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CURRENT = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m'
const DAILY = 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,weather_code'

export function buildForecastUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: CURRENT, daily: DAILY, timezone: 'auto', forecast_days: '1' })
  return `${ENDPOINT}?${p}`
}

const first = (v: unknown) => (Array.isArray(v) ? v[0] : undefined)
const str = (x: unknown) => (typeof x === 'string' && x ? x : null)

export function parseForecast(json: unknown): CurrentWeather {
  const j = json as { current?: Record<string, unknown>; daily?: Record<string, unknown>; timezone?: unknown } | null
  const c = j?.current
  if (!c || typeof c !== 'object') throw new WeatherError('format', 'پاسخ آب‌وهوا نامعتبر است.')
  const d = j?.daily ?? {}
  const isDay = finiteOrNull(c.is_day)
  const out: CurrentWeather = {
    temperature: finiteOrNull(c.temperature_2m), apparentTemperature: finiteOrNull(c.apparent_temperature), humidity: finiteOrNull(c.relative_humidity_2m),
    isDay: isDay === null ? null : isDay === 1, precipitation: finiteOrNull(c.precipitation), weatherCode: finiteOrNull(c.weather_code), windSpeed: finiteOrNull(c.wind_speed_10m),
    tempMax: finiteOrNull(first(d.temperature_2m_max)), tempMin: finiteOrNull(first(d.temperature_2m_min)), precipitationProbability: finiteOrNull(first(d.precipitation_probability_max)),
    sunrise: str(first(d.sunrise)), sunset: str(first(d.sunset)), timezone: str(j?.timezone),
  }
  if (out.temperature === null && out.weatherCode === null) throw new WeatherError('format', 'پاسخ آب‌وهوا دادهٔ قابل‌استفاده ندارد.')
  return out
}

export async function fetchForecast(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<CurrentWeather> {
  let res: Response
  try { res = await fetchImpl(buildForecastUrl(lat, lon), { signal: AbortSignal.timeout(15_000) }) } catch { throw new WeatherError('network', 'اتصال به سرویس آب‌وهوا برقرار نشد.', true) }
  if (!res.ok) throw new WeatherError(res.status === 429 ? 'rate' : 'http', `خطای سرویس (${res.status}).`, res.status === 429 || res.status >= 500)
  try { return parseForecast(await res.json()) } catch (e) { throw e instanceof WeatherError ? e : new WeatherError('format', 'پاسخ آب‌وهوا نامعتبر است.') }
}
