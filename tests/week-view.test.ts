import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, dayNumber, fromDayNumber, isSameDate } from '../src/lib/jalali'

test('شمارهٔ روز: رفت‌وبرگشت و جابه‌جایی روز به روز', () => {
  const d = { year: 1405, month: 7, day: 23 }
  assert.ok(isSameDate(fromDayNumber(dayNumber(d)), d))
  assert.equal(dayNumber(addDays(d, 1)) - dayNumber(d), 1)
  assert.ok(isSameDate(addDays({ year: 1405, month: 7, day: 30 }, 1), { year: 1405, month: 8, day: 1 }))
  assert.ok(isSameDate(addDays({ year: 1405, month: 8, day: 1 }, -1), { year: 1405, month: 7, day: 30 }))
  assert.ok(isSameDate(addDays({ year: 1405, month: 12, day: 29 }, 1), { year: 1406, month: 1, day: 1 })) // ۱۴۰۵ کبیسه نیست
  assert.ok(isSameDate(addDays({ year: 1403, month: 12, day: 29 }, 1), { year: 1403, month: 12, day: 30 })) // ۱۴۰۳ کبیسه است
})

test('۳۰۰ روز پشت‌سرهم بدون پرش یا تکرار', () => {
  let prev = dayNumber({ year: 1404, month: 1, day: 1 })
  for (let i = 1; i < 800; i++) {
    const d = fromDayNumber(prev + 1); assert.equal(dayNumber(d), prev + 1); prev++
  }
})
