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

const hr = (time: string, temperature: number | null, weatherCode: number | null = 0) => ({ time, temperature, apparent: null, weatherCode, isDay: true, precipitationProbability: null, precipitation: null, humidity: null, windSpeed: null, windGusts: null, windDirection: null, cloudCover: null, uv: null, visibility: null })

test('دمای همین ساعت از پیش‌بینی ساعتی (نه میانگین روز)؛ آیکون از کد هوا', () => {
  const w = W({ hourly: [hr('2026-10-13T11:00', 17), hr('2026-10-13T12:00', 22.4), hr('2026-10-13T13:00', 24)] })
  const r = notificationWeather({ weather: w, updatedAt: NOON - 86_400_000 }, NOON)!
  assert.equal(r.temp, 22); assert.equal(r.icon, 'sun'); assert.equal(weatherSignature(r), 'sun|22')
})
test('بدون ردیف ساعتی: دمای فعلیِ تازه؛ دادهٔ کهنه یا ناقص نمایش داده نمی‌شود (نه ساختگی، نه کهنه)', () => {
  assert.equal(notificationWeather({ weather: W(), updatedAt: NOON - 3600_000 }, NOON)!.temp, 20)
  assert.equal(notificationWeather({ weather: null, updatedAt: null }, NOON), null)
  assert.equal(notificationWeather({ weather: W({ temperature: null }), updatedAt: NOON }, NOON), null)
  assert.equal(notificationWeather({ weather: W({ weatherCode: null }), updatedAt: NOON }, NOON), null)
  assert.equal(notificationWeather({ weather: W(), updatedAt: NOON - 5 * 3600_000 }, NOON), null)
  assert.equal(weatherSignature(null), '')
  assert.equal(localDayKey(NOON), '2026-10-13')
})

import { hourlyPlan, isoDay, notificationTitle, tempLabel } from '../src/lib/dateNotificationData'
const loadAll = () => { const m = { exports: {} as unknown }; const g: Record<string, unknown> = {}; new Function('module', 'self', readFileSync('public/date-title.js', 'utf8'))(m, g); return g as { taghvimNotifTitle: (d: Date, temp: number | null) => string } }
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
test('طرح ساعتی: برای هر روز و ساعت دما و آیکون؛ ساعت بدون دما حذف می‌شود', () => {
  const w = W({ hourly: [hr('2026-10-13T12:00', 22.6), hr('2026-10-13T13:00', null), hr('2026-10-14T00:00', -3, 61)] })
  const p = hourlyPlan(w)
  assert.deepEqual(p, { '2026-10-13': { '12': { icon: 'sun', temp: 23 } }, '2026-10-14': { '00': { icon: 'rain', temp: -3 } } })
  assert.equal(isoDay(NOON), '2026-10-13')
})
