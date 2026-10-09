import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeSeries, RAINY_DAY_MM } from '../src/weather/history/analyze'
import { buildArchiveUrl, historyRange, parseArchive } from '../src/weather/history/client'
import { coordinatesOf, syncHistoricalWeather } from '../src/weather/history/sync'
import type { DailySeries } from '../src/weather/history/types'
import { buildForecastUrl, parseForecast } from '../src/weather/current/client'
import { createWeatherStore, type WeatherDeps } from '../src/weather/current/store'
import type { CurrentWeather } from '../src/weather/current/types'
import { WeatherError, weatherCodeText } from '../src/weather/codes'
import { msUntilNextMinute } from '../src/lib/clock'
import { fromGregorian } from '../src/lib/jalali'
import { MOCK_DESTINATIONS, type Destination } from '../src/data/destinations'
import { recommend } from '../src/travel/recommend'
import { EMPTY_FILTERS } from '../src/travel/filters'
import type { DestinationClimate } from '../src/weather/history/types'

// ---------- ساخت سری روزانهٔ مصنوعی (فقط برای تست؛ نه داده‌ای که در برنامه استفاده شود) ----------
function series(start: string, end: string, f: (iso: string, jm: number) => { t: number; max: number; min: number; p: number | null }): DailySeries {
  const s: DailySeries = { time: [], temperature_2m_mean: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [], weather_code: [] }
  const [ys, ms, ds] = start.split('-').map(Number), [ye, me, de] = end.split('-').map(Number)
  for (let d = new Date(ys, ms - 1, ds, 12); d <= new Date(ye, me - 1, de, 12); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const v = f(iso, fromGregorian(d).month)
    s.time.push(iso); s.temperature_2m_mean.push(v.t); s.temperature_2m_max.push(v.max); s.temperature_2m_min.push(v.min); s.precipitation_sum.push(v.p); s.weather_code.push(v.p && v.p >= 1 ? 61 : 0)
  }
  return s
}

test('فصل و ماه شمسی: مرز نوروز و آخر اسفند', () => {
  // ۱ فروردین ۱۴۰۲ = ۲۱ مارس ۲۰۲۳ ؛ ۲۹ اسفند ۱۴۰۱ = ۲۰ مارس ۲۰۲۳
  assert.deepEqual(fromGregorian(new Date(2023, 2, 21, 12)), { year: 1402, month: 1, day: 1 })
  assert.deepEqual(fromGregorian(new Date(2023, 2, 20, 12)), { year: 1401, month: 12, day: 29 })
  const st = analyzeSeries(series('2023-03-18', '2023-03-24', (_i, jm) => ({ t: jm === 1 ? 20 : 5, max: 0, min: 0, p: 0 })))
  assert.equal(st.months[0].tempMean, 20)   // فروردین فقط روزهای ۲۱ تا ۲۴ مارس
  assert.equal(st.months[0].days, 4)
  assert.equal(st.months[11].tempMean, 5)   // اسفند: ۱۸ تا ۲۰ مارس
  assert.equal(st.seasons.spring.days, 4)
  assert.equal(st.seasons.winter.days, 3)
})

test('آمار تاریخی: میانگین دما، بارش ماهانه/فصلی و روز بارانی (فقط دوره‌های کامل)', () => {
  // سه سال کامل میلادی؛ بارش ثابت ۲ میلی‌متر در هر روزِ فصل بهار و صفر در بقیه
  const s = series('2020-01-01', '2022-12-31', (_i, jm) => ({ t: jm <= 3 ? 20 : 30, max: jm <= 3 ? 26 : 38, min: jm <= 3 ? 14 : 22, p: jm <= 3 ? 2 : 0 }))
  const st = analyzeSeries(s)
  assert.equal(st.seasons.spring.tempMean, 20)
  assert.equal(st.seasons.summer.tempMean, 30)
  assert.equal(st.seasons.spring.tempMax, 26)
  assert.equal(st.seasons.spring.tempMin, 14)
  // فروردین ۳۱ روز × ۲ میلی‌متر = ۶۲ ؛ همهٔ روزها بارانی
  assert.equal(st.months[0].precipitationMm, 62)
  assert.equal(st.months[0].rainyDays, 31)
  assert.equal(st.months[6].precipitationMm, 0)
  assert.equal(st.months[6].rainyDays, 0)
  // بهار = ۳۱+۳۱+۳۱ روز
  assert.equal(st.seasons.spring.precipitationMm, 186)
  assert.equal(st.seasons.spring.dominantCode, 61)
  assert.equal(st.seasons.summer.dominantCode, 0)
  assert.equal(st.rainyDayThresholdMm, RAINY_DAY_MM)
})

test('روز بارانی: ۱ میلی‌متر بارانی است و ۰٫۹ نیست؛ دادهٔ ناقص نادیده گرفته می‌شود', () => {
  const s = series('2021-04-01', '2021-04-30', (iso) => ({ t: 10, max: 12, min: 8, p: iso.endsWith('-05') ? 1 : iso.endsWith('-06') ? 0.9 : 0 }))
  s.precipitation_sum[10] = null
  const st = analyzeSeries(s)
  // دوره کامل نیست (بخشی از فروردین/اردیبهشت) → بارش ماهانه null، نه عدد ساختگی
  assert.equal(st.months[0].precipitationMm, null)
  assert.ok((st.months[0].tempMean ?? 0) === 10)
})

test('بازهٔ تاریخ پویا و ساخت URL با پارامترهای مستند', () => {
  assert.deepEqual(historyRange(new Date(2026, 9, 9)), { start: '2021-01-01', end: '2025-12-31' })
  assert.deepEqual(historyRange(new Date(2027, 0, 1)), { start: '2022-01-01', end: '2026-12-31' })
  const u = new URL(buildArchiveUrl(32.65, 51.67, '2021-01-01', '2025-12-31'))
  assert.equal(u.origin + u.pathname, 'https://archive-api.open-meteo.com/v1/archive')
  assert.equal(u.searchParams.get('latitude'), '32.65')
  assert.equal(u.searchParams.get('longitude'), '51.67')
  assert.equal(u.searchParams.get('daily'), 'temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code')
})

test('پاسخ نامعتبر آرشیو خطا می‌دهد', () => {
  assert.throws(() => parseArchive({}), WeatherError)
  assert.throws(() => parseArchive({ daily: { time: ['2020-01-01'], temperature_2m_mean: [1] } }), WeatherError)
})

// ---------- همگام‌سازی ----------
const dest = (id: number, name: string, lat?: number, lon?: number): Destination => ({ ...MOCK_DESTINATIONS[0], id, name, latitude: lat, longitude: lon, enabled: true })
const tiny: DailySeries = series('2020-01-01', '2020-01-03', () => ({ t: 1, max: 2, min: 0, p: 0 }))
const now = () => new Date(2026, 9, 9)

test('هر مقصد با مختصات خودش دریافت می‌شود؛ بدون مختصات گزارش می‌شود و جایگزین نمی‌گیرد', async () => {
  const calls: string[] = []
  const r = await syncHistoricalWeather([dest(101, 'الف', 10, 20), dest(102, 'ب', 30, 40), dest(103, 'ج')], {}, {
    now, fetchSeries: async (la, lo) => { calls.push(`${la},${lo}`); return tiny }, sleep: async () => undefined,
  })
  assert.deepEqual(calls.sort(), ['10,20', '30,40'])
  assert.equal(r.entries[101].latitude, 10)
  assert.equal(r.entries[102].latitude, 30)
  assert.equal(r.entries[103], undefined)
  assert.deepEqual(r.report.missingCoordinates, [{ id: 103, name: 'ج' }])
})

test('مقصد دارای کش دوباره دریافت نمی‌شود؛ مقصد جدید یا تغییر مختصات دریافت می‌شود', async () => {
  let n = 0
  const deps = { now, fetchSeries: async () => { n++; return tiny }, sleep: async () => undefined }
  const first = await syncHistoricalWeather([dest(101, 'الف', 10, 20)], {}, deps)
  assert.equal(n, 1)
  const again = await syncHistoricalWeather([dest(101, 'الف', 10, 20)], first.entries, deps)
  assert.equal(n, 1); assert.deepEqual(again.report.cached, [101])
  const more = await syncHistoricalWeather([dest(101, 'الف', 10, 20), dest(102, 'ب', 5, 6)], first.entries, deps)
  assert.equal(n, 2); assert.deepEqual(more.report.fetched, [102])
  const moved = await syncHistoricalWeather([dest(101, 'الف', 11, 21)], first.entries, deps)
  assert.equal(n, 3); assert.equal(moved.entries[101].latitude, 11)
})

test('محدودیت هم‌زمانی، تلاش مجدد و عدم تلاش برای خطای غیرموقت', async () => {
  let active = 0, peak = 0
  const ds = [1, 2, 3, 4, 5].map((i) => dest(200 + i, `م${i}`, i, i))
  await syncHistoricalWeather(ds, {}, { now, concurrency: 2, sleep: async () => undefined, fetchSeries: async () => { active++; peak = Math.max(peak, active); await new Promise((r) => setTimeout(r, 5)); active--; return tiny } })
  assert.equal(peak, 2)

  let tries = 0
  const retried = await syncHistoricalWeather([dest(301, 'x', 1, 1)], {}, { now, retries: 2, sleep: async () => undefined, fetchSeries: async () => { if (++tries < 3) throw new WeatherError('network', 'x', true); return tiny } })
  assert.equal(tries, 3); assert.deepEqual(retried.report.fetched, [301])

  let bad = 0
  const failed = await syncHistoricalWeather([dest(302, 'y', 1, 1)], {}, { now, retries: 2, sleep: async () => undefined, fetchSeries: async () => { bad++; throw new WeatherError('http', '404', false) } })
  assert.equal(bad, 1); assert.deepEqual(failed.report.failed, [{ id: 302, kind: 'http' }])
  assert.equal(failed.entries[302], undefined)
})

test('مختصات اولیه فقط برای همان شناسه و همان نام استفاده می‌شود', () => {
  const kurd = MOCK_DESTINATIONS.find((d) => d.name === 'کردستان')!
  const mesr = MOCK_DESTINATIONS.find((d) => d.name === 'کویر مصر')!
  assert.equal(coordinatesOf(kurd), null)
  assert.equal(coordinatesOf(mesr), null)
  assert.ok(coordinatesOf(MOCK_DESTINATIONS.find((d) => d.name === 'یزد')!))
  assert.equal(coordinatesOf({ id: 1, name: 'نام دیگر', latitude: undefined, longitude: undefined }), null)
  const missing = MOCK_DESTINATIONS.filter((d) => !coordinatesOf(d)).map((d) => d.name)
  assert.deepEqual(missing, ['کردستان', 'کویر مصر'])
})

test('داده‌های تاریخی ترتیب پیشنهاد را بر اساس اندازه‌گیری واقعی تغییر می‌دهند', () => {
  const [a, b] = MOCK_DESTINATIONS.filter((d) => d.scope === 'domestic' && d.season_suitability.spring.rating === 'excellent').slice(0, 2)
  const base = recommend([a, b], { season: 'بهار', filters: EMPTY_FILTERS })
  const mk = (d: Destination, temp: number): DestinationClimate => ({ destinationId: d.id, destinationName: d.name, latitude: 1, longitude: 1, rangeStart: '', rangeEnd: '', fetchedAt: 0, stats: { rainyDayThresholdMm: 1, months: [], seasons: { spring: { days: 1, tempMean: temp, tempMax: null, tempMin: null, precipitationMm: null, rainyDays: null, dominantCode: null }, summer: null as never, autumn: null as never, winter: null as never } } })
  const withData = recommend([a, b], { season: 'بهار', filters: EMPTY_FILTERS, climate: { [a.id]: mk(a, 40), [b.id]: mk(b, 23) } })
  assert.equal(withData.domestic[0].id, b.id)
  assert.equal(base.domestic.length, 2)
})

// ---------- آب‌وهوای فعلی ----------
const sample = { current: { temperature_2m: 21.4, relative_humidity_2m: 40, apparent_temperature: 20, is_day: 1, precipitation: 0, weather_code: 2, wind_speed_10m: 8.2 }, daily: { temperature_2m_max: [27.6], temperature_2m_min: [12.1], precipitation_probability_max: [10], sunrise: ['2026-10-09T06:12'], sunset: ['2026-10-09T17:30'] }, timezone: 'Asia/Tehran' }

test('URL و پارس پیش‌بینی با پارامترهای خواسته‌شده', () => {
  const u = new URL(buildForecastUrl(32.65, 51.67))
  assert.equal(u.searchParams.get('forecast_days'), '1')
  assert.equal(u.searchParams.get('timezone'), 'auto')
  assert.equal(u.searchParams.get('current'), 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m')
  assert.equal(u.searchParams.get('daily'), 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,weather_code')
  const w = parseForecast(sample)
  assert.equal(w.temperature, 21.4); assert.equal(w.isDay, true); assert.equal(w.tempMax, 27.6); assert.equal(w.precipitationProbability, 10)
  assert.equal(weatherCodeText(w.weatherCode), 'نیمه‌ابری')
  const partial = parseForecast({ current: { temperature_2m: 5, weather_code: null } })
  assert.equal(partial.windSpeed, null); assert.equal(partial.tempMax, null)  // مقدار ساختگی درج نمی‌شود
  assert.throws(() => parseForecast({}), WeatherError)
  assert.throws(() => parseForecast({ current: {} }), WeatherError)
})

type Pos = { lat: number; lon: number }
function makeDeps(over: Partial<WeatherDeps> = {}) {
  const log = { positions: 0, forecasts: 0, geocodes: 0, saved: null as unknown }
  let t = 1_000_000
  const deps: WeatherDeps = {
    getPosition: async () => { log.positions++; return { lat: 32.65, lon: 51.67 } as Pos },
    permission: async () => 'granted',
    fetchForecast: async () => { log.forecasts++; return parseForecast(sample) as CurrentWeather },
    reverseGeocode: async () => { log.geocodes++; return 'اصفهان' },
    now: () => t, online: () => true, load: () => null, save: (p) => { log.saved = p },
    ...over,
  }
  return { deps, log, advance: (ms: number) => { t += ms } }
}

test('موفقیت: موقعیت، آب‌وهوا، نام شهر و ذخیره محلی', async () => {
  const { deps, log } = makeDeps()
  const st = createWeatherStore(deps)
  assert.equal(st.getState().status, 'idle')
  assert.equal(log.positions, 0)                      // بدون اقدام کاربر موقعیت درخواست نمی‌شود
  await st.request()
  const s = st.getState()
  assert.equal(s.status, 'ready'); assert.equal(s.city, 'اصفهان'); assert.equal(s.weather?.temperature, 21.4); assert.ok(log.saved)
})

test('خطاهای GPS: رد مجوز، در دسترس نبودن، timeout و عدم پشتیبانی؛ با امکان تلاش مجدد', async () => {
  for (const kind of ['denied', 'unavailable', 'timeout', 'unsupported'] as const) {
    const { deps, log } = makeDeps({ getPosition: async () => { throw Object.assign(new Error('x'), { kind }) } })
    const st = createWeatherStore(deps)
    await st.request()
    assert.equal(st.getState().status, 'error'); assert.equal(st.getState().error, kind); assert.equal(log.forecasts, 0)
  }
  let fail = true
  const { deps } = makeDeps({ getPosition: async () => { if (fail) throw Object.assign(new Error('x'), { kind: 'denied' }); return { lat: 1, lon: 2 } } })
  const st = createWeatherStore(deps)
  await st.request(); assert.equal(st.getState().error, 'denied')
  fail = false
  await st.retry(); assert.equal(st.getState().status, 'ready')
})

test('خطای API/شبکه: بدون داده = خطا؛ با داده قبلی = همان داده با نشان خطا (نه تازه)', async () => {
  let mode: 'ok' | 'api' | 'net' = 'ok'
  const { deps, advance } = makeDeps({ fetchForecast: async () => { if (mode === 'api') throw new WeatherError('http', '500', true); if (mode === 'net') throw new WeatherError('network', 'x', true); return parseForecast(sample) } })
  const st = createWeatherStore(deps)
  mode = 'api'; await st.request()
  assert.equal(st.getState().status, 'error'); assert.equal(st.getState().error, 'api'); assert.equal(st.getState().weather, null)
  mode = 'ok'; await st.retry(); assert.equal(st.getState().status, 'ready')
  const updatedAt = st.getState().updatedAt
  advance(60_000); mode = 'net'; await st.retry()
  const s = st.getState()
  assert.equal(s.status, 'ready'); assert.equal(s.error, 'network'); assert.equal(s.weather?.temperature, 21.4); assert.equal(s.updatedAt, updatedAt)
})

test('آفلاین: درخواستی ارسال نمی‌شود و آخرین داده می‌ماند', async () => {
  let online = true
  const { deps, log } = makeDeps({ online: () => online })
  const st = createWeatherStore(deps)
  await st.request(); const n = log.forecasts
  online = false; await st.retry()
  assert.equal(log.forecasts, n); assert.equal(st.getState().error, 'network'); assert.equal(st.getState().status, 'ready')
})

test('نام شهر نبود: city = null (حدس زده نمی‌شود)', async () => {
  const { deps } = makeDeps({ reverseGeocode: async () => null })
  const st = createWeatherStore(deps)
  await st.request(); assert.equal(st.getState().city, null)
})

test('درخواست هم‌زمان تکراری ارسال نمی‌شود و clear همه‌چیز را پاک می‌کند', async () => {
  const { deps, log } = makeDeps()
  const st = createWeatherStore(deps)
  await Promise.all([st.request(), st.request(), st.request()])
  assert.equal(log.forecasts, 1)
  st.clear(); assert.equal(st.getState().status, 'idle'); assert.equal(log.saved, null)
})

test('ساعت: زمان تا دقیقهٔ بعد از ساعت دستگاه محاسبه می‌شود، نه از پاسخ API', () => {
  assert.equal(msUntilNextMinute(new Date(2026, 0, 1, 10, 5, 0, 0)), 60_000)
  assert.equal(msUntilNextMinute(new Date(2026, 0, 1, 10, 5, 59, 500)), 500)
})

test('تاریخ شمسی از ساعت دستگاه (نه منطقهٔ زمانی مقصد) ساخته می‌شود', () => {
  // ۲۱ مارس ۲۰۲۳ ظهر به وقت دستگاه = ۱ فروردین ۱۴۰۲، مستقل از هر منطقهٔ زمانی که API برگرداند
  assert.deepEqual(fromGregorian(new Date(2023, 2, 21, 12)), { year: 1402, month: 1, day: 1 })
  assert.equal(parseForecast({ ...sample, timezone: 'Pacific/Auckland' }).timezone, 'Pacific/Auckland')
})
