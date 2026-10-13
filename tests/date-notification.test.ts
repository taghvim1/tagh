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
    assert.equal(t.title, formatLongDate(j), d.toISOString()); n++
  }
  assert.ok(n > 4000)
})
test('نمونه: عنوان فارسی با نام روز هفته', () => {
  assert.match(load()(new Date(2026, 9, 12, 12)).title, /^دوشنبه ۲۰ مهر ۱۴۰۵$/)
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
