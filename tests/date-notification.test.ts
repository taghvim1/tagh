import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { formatLongDate, fromGregorian } from '../src/lib/jalali'

const load = () => { const m = { exports: {} as unknown }; new Function('module', 'self', readFileSync('public/date-title.js', 'utf8'))(m, globalThis); return m.exports as (d?: Date) => { year: number; month: number; day: number; title: string } }

test('عنوان اعلان (Intl) با تقویم برنامه (jalaali-js) برای ۱۲ سال پیاپی روز‌به‌روز یکی است', () => {
  const f = load(); let n = 0
  for (let d = new Date(2021, 2, 1, 12); d < new Date(2033, 2, 1); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
    const j = fromGregorian(d), t = f(d)
    assert.deepEqual([t.year, t.month, t.day], [j.year, j.month, j.day], d.toISOString())
    assert.equal(t.title + ' ' + t.year.toLocaleString('fa-IR', { useGrouping: false }), formatLongDate(j).replace(/ ([^ ]+)$/, ' ماه $1'), d.toISOString()); n++
  }
  assert.ok(n > 4000)
})
test('نمونه: عنوان فارسی با نام روز هفته', () => {
  assert.equal(load()(new Date(2026, 9, 12, 12)).title, 'دوشنبه ۲۰ مهر ماه') // بدون سال
  assert.equal(load()(new Date(2026, 9, 13, 12)).title, 'سه‌شنبه ۲۱ مهر ماه')
})

import { localDayKey, notificationWeather, weatherSignature } from '../src/lib/dateNotificationData'
const W = (over = {}) => ({ temperature: 20, apparentTemperature: 20, humidity: 40, isDay: true, precipitation: 0, weatherCode: 0, windSpeed: 5, tempMax: 25, tempMin: 12, precipitationProbability: 0, sunrise: null, sunset: null, timezone: null, ...over })
const NOON = new Date(2026, 9, 13, 12).getTime()

test('میانگین روز = (حداکثر+حداقل)/۲ گرد‌شده؛ آیکون از کد هوا', () => {
  const r = notificationWeather({ weather: W(), updatedAt: NOON }, NOON)!
  assert.equal(r.avg, 19); assert.equal(r.icon, 'sun'); assert.equal(weatherSignature(r), 'sun|19')
  assert.equal(notificationWeather({ weather: W({ tempMax: -2, tempMin: -9 }), updatedAt: NOON }, NOON)!.avg, -5)
})
test('دادهٔ ناقص یا مربوط به روز دیگر نمایش داده نمی‌شود (نه ساختگی، نه کهنه)', () => {
  assert.equal(notificationWeather({ weather: null, updatedAt: null }, NOON), null)
  assert.equal(notificationWeather({ weather: W({ tempMax: null }), updatedAt: NOON }, NOON), null)
  assert.equal(notificationWeather({ weather: W({ weatherCode: null }), updatedAt: NOON }, NOON), null)
  assert.equal(notificationWeather({ weather: W(), updatedAt: NOON - 86_400_000 }, NOON), null)
  assert.equal(weatherSignature(null), '')
  assert.equal(localDayKey(NOON), '2026-10-13')
})

import { dailyPlan, isoDay, notificationTitle, tempLabel } from '../src/lib/dateNotificationData'
const loadAll = () => { const m = { exports: {} as unknown }; const g: Record<string, unknown> = {}; new Function('module', 'self', readFileSync('public/date-title.js', 'utf8'))(m, g); return g as { taghvimNotifTitle: (d: Date, avg: number | null) => string } }
const day = (date: string, max: number | null, min: number | null, code: number | null = 0) => ({ date, weatherCode: code, tempMax: max, tempMin: min, apparentMax: null, apparentMin: null, precipitationSum: null, precipitationProbability: null, windMax: null, gustMax: null, uvMax: null, sunrise: null, sunset: null })

test('عنوان اعلان: تاریخ بدون سال + «دما °۲۲»؛ صفحه و Service Worker یک متن می‌سازند', () => {
  const t = notificationTitle('سه‌شنبه ۲۱ مهر ماه', 22)
  assert.equal(t, 'سه‌شنبه ۲۱ مهر ماه   ·   دما °۲۲')
  assert.equal(loadAll().taghvimNotifTitle(new Date(2026, 9, 13, 12), 22), t)
  assert.equal(loadAll().taghvimNotifTitle(new Date(2026, 9, 13, 12), -3), notificationTitle('سه‌شنبه ۲۱ مهر ماه', -3))
  assert.equal(tempLabel(-3), 'دما −°۳')
  assert.equal(notificationTitle('سه‌شنبه ۲۱ مهر ماه', null), 'سه‌شنبه ۲۱ مهر ماه')
  assert.equal(loadAll().taghvimNotifTitle(new Date(2026, 9, 13, 12), null), 'سه‌شنبه ۲۱ مهر ماه')
})
test('طرح ده‌روزه: برای هر روز میانگین و آیکون؛ روز بدون دما حذف می‌شود و ردیف امروز حتی با دادهٔ دیروز استفاده می‌شود', () => {
  const w = W({ daily: [day('2026-10-13', 25, 12), day('2026-10-14', 20, 10, 61), day('2026-10-15', null, 5)] })
  const p = dailyPlan(w)
  assert.deepEqual(p.map((x) => [x.date, x.weather.avg, x.weather.icon]), [['2026-10-13', 19, 'sun'], ['2026-10-14', 15, 'rain']])
  assert.equal(isoDay(NOON), '2026-10-13')
  assert.equal(notificationWeather({ weather: w, updatedAt: NOON - 3 * 86_400_000 }, NOON)!.avg, 19)
})
