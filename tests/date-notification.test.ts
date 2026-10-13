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
