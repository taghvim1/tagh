// آب‌وهوای فعلی از Open-Meteo Forecast API (بدون کلید API)
import { WeatherError, finiteOrNull } from '../codes'
import type { CurrentWeather, DailyForecast, HourlyForecast } from './types'

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CURRENT = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,pressure_msl'
const DAILY = 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset,weather_code'
const HOURLY = 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,uv_index,visibility,pressure_msl,is_day'
export const FORECAST_DAYS = 10
export const HOURLY_HOURS = 72

export function buildForecastUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: CURRENT, daily: DAILY, hourly: HOURLY, timezone: 'auto', forecast_days: String(FORECAST_DAYS) })
  return `${ENDPOINT}?${p}`
}

const first = (v: unknown) => (Array.isArray(v) ? v[0] : undefined)
const str = (x: unknown) => (typeof x === 'string' && x ? x : null)

const col = (o: Record<string, unknown> | undefined, k: string): unknown[] => (Array.isArray(o?.[k]) ? (o![k] as unknown[]) : [])

const mean = (xs: Array<number | null>) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }
/** جهت غالب باد (میانگین برداری) */
const meanDirection = (deg: Array<number | null>) => {
  const v = deg.filter((x): x is number => x !== null); if (!v.length) return null
  const x = v.reduce((a, d) => a + Math.cos((d * Math.PI) / 180), 0), y = v.reduce((a, d) => a + Math.sin((d * Math.PI) / 180), 0)
  return (Math.round((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360
}

/** میانگین‌های روزانه (رطوبت، فشار، دید، ابر، جهت باد) از دادهٔ ساعتیِ ده روز؛ بدون نیاز به متغیرهای روزانهٔ جداگانهٔ API */
function dayMeans(h: Record<string, unknown>) {
  const times = col(h, 'time'), by = new Map<string, number[]>()
  times.forEach((t, i) => { if (typeof t === 'string') by.set(t.slice(0, 10), [...(by.get(t.slice(0, 10)) ?? []), i]) })
  const pick = (k: string, idx: number[]) => idx.map((i) => finiteOrNull(col(h, k)[i]))
  return (date: string) => {
    const idx = by.get(date) ?? []
    return { humidity: mean(pick('relative_humidity_2m', idx)), pressure: mean(pick('pressure_msl', idx)), visibility: mean(pick('visibility', idx)), cloudCover: mean(pick('cloud_cover', idx)), windDirection: meanDirection(pick('wind_direction_10m', idx)) }
  }
}

function parseDaily(d: Record<string, unknown>, h: Record<string, unknown> = {}): DailyForecast[] {
  const means = dayMeans(h)
  const times = col(d, 'time')
  const at = (k: string, i: number) => finiteOrNull(col(d, k)[i])
  const s = (k: string, i: number) => str(col(d, k)[i])
  return times.flatMap((t, i): DailyForecast[] => typeof t !== 'string' ? [] : [{
    date: t, weatherCode: at('weather_code', i), tempMax: at('temperature_2m_max', i), tempMin: at('temperature_2m_min', i),
    apparentMax: at('apparent_temperature_max', i), apparentMin: at('apparent_temperature_min', i), precipitationSum: at('precipitation_sum', i),
    precipitationProbability: at('precipitation_probability_max', i), windMax: at('wind_speed_10m_max', i), gustMax: at('wind_gusts_10m_max', i),
    uvMax: at('uv_index_max', i), sunrise: s('sunrise', i), sunset: s('sunset', i), ...means(t),
  }])
}

/** ساعت‌های آینده (از ساعت جاری محلیِ مختصات)، حداکثر HOURLY_HOURS ساعت */
function parseHourly(h: Record<string, unknown>, currentTime: string | null): HourlyForecast[] {
  const times = col(h, 'time')
  const at = (k: string, i: number) => finiteOrNull(col(h, k)[i])
  const from = currentTime ? currentTime.slice(0, 13) : ''
  const out: HourlyForecast[] = []
  times.forEach((t, i) => {
    if (typeof t !== 'string' || t.slice(0, 13) < from || out.length >= HOURLY_HOURS) return
    const day = at('is_day', i)
    out.push({
      time: t, temperature: at('temperature_2m', i), apparent: at('apparent_temperature', i), weatherCode: at('weather_code', i), isDay: day === null ? null : day === 1,
      precipitationProbability: at('precipitation_probability', i), precipitation: at('precipitation', i), humidity: at('relative_humidity_2m', i),
      windSpeed: at('wind_speed_10m', i), windGusts: at('wind_gusts_10m', i), windDirection: at('wind_direction_10m', i), cloudCover: at('cloud_cover', i),
      uv: at('uv_index', i), visibility: at('visibility', i), pressure: at('pressure_msl', i),
    })
  })
  return out
}

export function parseForecast(json: unknown): CurrentWeather {
  const j = json as { current?: Record<string, unknown>; daily?: Record<string, unknown>; hourly?: Record<string, unknown>; timezone?: unknown } | null
  const c = j?.current
  if (!c || typeof c !== 'object') throw new WeatherError('format', 'پاسخ آب‌وهوا نامعتبر است.')
  const d = j?.daily ?? {}
  const isDay = finiteOrNull(c.is_day)
  const out: CurrentWeather = {
    temperature: finiteOrNull(c.temperature_2m), apparentTemperature: finiteOrNull(c.apparent_temperature), humidity: finiteOrNull(c.relative_humidity_2m),
    isDay: isDay === null ? null : isDay === 1, precipitation: finiteOrNull(c.precipitation), weatherCode: finiteOrNull(c.weather_code), windSpeed: finiteOrNull(c.wind_speed_10m),
    tempMax: finiteOrNull(first(d.temperature_2m_max)), tempMin: finiteOrNull(first(d.temperature_2m_min)), precipitationProbability: finiteOrNull(first(d.precipitation_probability_max)),
    sunrise: str(first(d.sunrise)), sunset: str(first(d.sunset)), timezone: str(j?.timezone),
    windGusts: finiteOrNull(c.wind_gusts_10m), windDirection: finiteOrNull(c.wind_direction_10m), cloudCover: finiteOrNull(c.cloud_cover), pressure: finiteOrNull(c.pressure_msl),
    daily: parseDaily(d, j?.hourly ?? {}), hourly: parseHourly(j?.hourly ?? {}, str(c.time)),
  }
  if (out.temperature === null && out.weatherCode === null) throw new WeatherError('format', 'پاسخ آب‌وهوا دادهٔ قابل‌استفاده ندارد.')
  return out
}

const AQ_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality'
export const buildAirQualityUrl = (lat: number, lon: number) => `${AQ_ENDPOINT}?${new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'us_aqi', hourly: 'us_aqi', timezone: 'auto', forecast_days: '7' })}`

/** شاخص کیفیت هوا (US AQI) را به پیش‌بینی اضافه می‌کند؛ هر ساعت/روزی که داده ندارد null می‌ماند (حدس زده نمی‌شود) */
export function mergeAirQuality(w: CurrentWeather, json: unknown): CurrentWeather {
  const j = json as { current?: Record<string, unknown>; hourly?: Record<string, unknown> } | null
  const times = col(j?.hourly, 'time'), vals = col(j?.hourly, 'us_aqi')
  const byTime = new Map<string, number>(), byDay = new Map<string, number[]>()
  times.forEach((t, i) => { const v = finiteOrNull(vals[i]); if (typeof t === 'string' && v !== null) { byTime.set(t.slice(0, 13), v); byDay.set(t.slice(0, 10), [...(byDay.get(t.slice(0, 10)) ?? []), v]) } })
  return {
    ...w, aqi: finiteOrNull(j?.current?.us_aqi),
    hourly: w.hourly?.map((h) => ({ ...h, aqi: byTime.get(h.time.slice(0, 13)) ?? null })),
    daily: w.daily?.map((d) => { const v = byDay.get(d.date); return { ...d, aqi: v?.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null } }),
  }
}

export async function fetchForecast(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<CurrentWeather> {
  let res: Response
  try { res = await fetchImpl(buildForecastUrl(lat, lon), { signal: AbortSignal.timeout(15_000) }) } catch { throw new WeatherError('network', 'اتصال به سرویس آب‌وهوا برقرار نشد.', true) }
  if (!res.ok) throw new WeatherError(res.status === 429 ? 'rate' : 'http', `خطای سرویس (${res.status}).`, res.status === 429 || res.status >= 500)
  let weather: CurrentWeather
  try { weather = parseForecast(await res.json()) } catch (e) { throw e instanceof WeatherError ? e : new WeatherError('format', 'پاسخ آب‌وهوا نامعتبر است.') }
  // کیفیت هوا اختیاری است: خطا یا نبودِ آن، آب‌وهوا را خراب نمی‌کند
  try {
    const aq = await fetchImpl(buildAirQualityUrl(lat, lon), { signal: AbortSignal.timeout(8_000) })
    if (aq.ok) weather = mergeAirQuality(weather, await aq.json())
  } catch { /* بدون AQI */ }
  return weather
}
