import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import bundled from '../public/data/calendar-data.json'
import { getOccasion, getOccasionList, type CalendarData } from '../src/lib/calendarData'
import { setAncientCelebrations, setWorldDays } from '../src/lib/settings'

const data = bundled as unknown as CalendarData

afterEach(() => { setWorldDays(true); setAncientCelebrations(true) })

describe('مناسبت‌های سال‌محور', () => {
  test('داده‌ی همراه برنامه سال‌های ۱۳۹۹ تا ۱۴۰۶ را دارد و عنوان‌ها پاک‌سازی شده‌اند', () => {
    assert.ok(data.version >= 3)
    assert.deepEqual(Object.keys(data.years ?? {}).sort(), ['1399', '1400', '1401', '1402', '1403', '1404', '1405', '1406'])
    for (const days of Object.values(data.years!)) for (const list of Object.values(days)) for (const [title] of list) {
      assert.ok(!/[\[\]]/.test(title), title) // بدون تاریخ داخل کروشه
      assert.ok(!/[يك]/.test(title), title) // ی/ک عربی نباشد
    }
  })

  test('مناسبت قمری هر سال در تاریخ خودش می‌آید (عاشورا ۱۴۰۵ در ۵ تیر)', () => {
    const a = getOccasion(4, 5, 1405)
    assert.ok(a?.holiday && a.title.includes('عاشورا'))
    assert.ok(!getOccasion(4, 5, 1406)?.title.includes('عاشورا')) // سال بعد جابه‌جا شده است
    const next = Object.entries(data.years!['1406']).find(([, l]) => l.some(([t]) => t.includes('عاشورا')))
    assert.ok(next && next[0] !== '4-5', 'عاشورای ۱۴۰۶ باید در روز دیگری باشد')
  })

  test('تعطیلی ثابت حفظ می‌شود و تکراری نمی‌شود (۱۳ فروردین)', () => {
    const o = getOccasion(1, 13, 1405)!
    assert.equal(o.holiday, true)
    assert.equal(getOccasionList(1, 13, 1405).filter((c) => c.holiday).length, 1)
  })

  test('بدون سال فقط مناسبت‌های ثابت برمی‌گردد', () => {
    assert.equal(getOccasion(7, 25), undefined)
    assert.equal(getOccasion(7, 25, 1405)?.title.includes('زینب'), true)
  })

  test('ترتیب اهمیت: تعطیل، مذهبی، ملی، جهانی؛ بقیه در more', () => {
    const list = getOccasionList(7, 25, 1405)
    assert.ok(list.length >= 2)
    assert.ok(list[0].title.includes('زینب')) // مذهبی پیش از جهانی
    assert.deepEqual(getOccasion(7, 25, 1405)!.more, list.slice(1).map((c) => c.title))
    const nowruz = getOccasionList(1, 1, 1405)
    assert.equal(nowruz[0].holiday, true)
  })

  test('مناسبت‌های ثابتِ باستانی/فرضی کنار داده‌ی سال هم می‌مانند', () => {
    assert.ok(getOccasionList(7, 16, 1405).some((c) => c.title === 'مهرگان'))
    assert.ok(getOccasionList(7, 12, 1405).some((c) => c.hypothetical))
  })

  test('خاموش‌کردن «روزهای جهانی و ملی» فقط روزهای غیرتعطیل جهانی/ملی را پنهان می‌کند', () => {
    assert.ok(getOccasion(7, 24, 1405)?.title.includes('غذا')) // روز جهانی غذا
    setWorldDays(false)
    assert.equal(getOccasion(7, 24, 1405), undefined)
    assert.ok(getOccasion(7, 25, 1405)?.title.includes('زینب')) // مذهبی می‌ماند
    assert.equal(getOccasion(1, 13, 1405)?.holiday, true) // تعطیلی هرگز پنهان نمی‌شود
    assert.ok(getOccasionList(7, 25, 1405).every((c) => !c.title.includes('فقر'))) // جهانی همان روز پنهان
  })

  test('خاموش‌کردن آیین‌های باستانی همچنان کار می‌کند', () => {
    setAncientCelebrations(false)
    assert.ok(!getOccasionList(7, 16, 1405).some((c) => c.title === 'مهرگان'))
  })
})
