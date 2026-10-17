import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import bundled from '../public/data/calendar-data.json'
// @ts-expect-error — ماژول جاوااسکریپتی بدون تایپ (همان منطق اسکریپت ورود داده)
import { classify, cleanTitle } from '../scripts/holidays-lib.mjs'
import { buildEvents, EVENT_TYPES } from '../src/admin/data/events'
import { getOccasion, getOccasionList, type CalendarData } from '../src/lib/calendarData'
import { setAncientCelebrations, setNationalDays, setReligiousDays, setWorldDays } from '../src/lib/settings'

const data = bundled as unknown as CalendarData
const resetPrefs = () => { setReligiousDays(true); setAncientCelebrations(true); setWorldDays(true); setNationalDays(true) }
afterEach(resetPrefs)

describe('داده‌ی مناسبت‌ها (پس از ریست و ورود دوباره)', () => {
  test('مناسبت‌های ثابتِ آزمایشیِ قبلی پاک شده‌اند و فقط داده‌ی سال‌محور هست', () => {
    assert.ok(data.version >= 4)
    assert.deepEqual(data.occasions, {})
    assert.deepEqual(Object.keys(data.years ?? {}).sort(), ['1399', '1400', '1401', '1402', '1403', '1404', '1405', '1406'])
    const all = Object.values(data.years!).flatMap((d) => Object.values(d).flat())
    assert.ok(all.length > 1800)
    for (const [title, kind] of all) {
      assert.ok(['r', 'a', 'i', 'n'].includes(kind), title)
      assert.ok(!/[\[\]]/.test(title) && !/[يك]/.test(title), title) // بدون کروشه و بدون ی/ک عربی
      assert.ok(!title.includes('مناسبت آزمایشی') && title !== 'روز مهربانی', title) // نمونه‌های آزمایشی قبلی
    }
  })

  test('هر چهار دسته در داده هست', () => {
    const kinds = new Set(Object.values(data.years!['1405']).flat().map((e) => e[1]))
    assert.deepEqual([...kinds].sort(), ['a', 'i', 'n', 'r'])
  })

  test('مناسبت قمری هر سال در تاریخ خودش می‌آید (عاشورا ۱۴۰۵ در ۵ تیر)', () => {
    const a = getOccasion(4, 5, 1405)
    assert.ok(a?.holiday && a.title.includes('عاشورا') && a.kind === 'r')
    assert.ok(!getOccasion(4, 5, 1406)?.title.includes('عاشورا'))
  })

  test('بدون سال هیچ مناسبتی برنمی‌گردد (دیگر مناسبت ثابت دستی نیست)', () => {
    assert.equal(getOccasion(7, 25), undefined)
    assert.equal(getOccasion(1, 13), undefined)
  })
})

describe('دسته‌بندی', () => {
  test('classify', () => {
    assert.equal(classify('جشن شب یلدا، شب چلّه', 'national'), 'a')
    assert.equal(classify('جشن سده، گرامیداشتِ کشف آتش به دستِ هوشنگ شاه', 'national'), 'a')
    assert.equal(classify('جشن چهارشنبه سوری', 'national'), 'a')
    assert.equal(classify('سالروز شهادت اَشو زرتشت', 'religious'), 'a') // دین زرتشتی ⇒ باستانی/آیینی
    assert.equal(classify('روز جهانی غذا', 'international'), 'i')
    assert.equal(classify('روز جهانی نوروز', 'international'), 'i') // نوع جهانی بر کلیدواژه می‌چربد
    assert.equal(classify('جشن کریسمس', 'national'), 'i')
    assert.equal(classify('اربعین حسینی', 'national'), 'r')
    assert.equal(classify('میلاد رسول اکرم به روایت اهل سنت', 'national'), 'r')
    assert.equal(classify('ولادت حضرت زینب', 'religious'), 'r')
    assert.equal(classify('روز بزرگداشت حافظ', 'national'), 'n')
  })
  test('cleanTitle تاریخ داخل کروشه را حذف می‌کند', () => {
    assert.equal(cleanTitle('عید سعید فطر [ ١ شوال ]'), 'عید سعید فطر')
    assert.equal(cleanTitle('علي  كاظم'), 'علی کاظم')
  })
})

describe('کلید خاموش/روشن هر دسته', () => {
  const first = (kind: string) => {
    for (const [y, days] of Object.entries(data.years!)) for (const [key, list] of Object.entries(days)) {
      if (list.length === 1 && list[0][1] === kind && list[0][2] !== 1) { const [m, d] = key.split('-').map(Number); return { m, d, y: Number(y) } }
    }
    throw new Error('no day for ' + kind)
  }
  const cases: [string, 'r' | 'a' | 'i' | 'n', (v: boolean) => void][] = [
    ['مذهبی', 'r', setReligiousDays], ['باستانی و آیینی', 'a', setAncientCelebrations], ['جهانی', 'i', setWorldDays], ['ملی', 'n', setNationalDays],
  ]
  for (const [name, kind, setter] of cases) {
    test(`خاموش‌کردن «${name}» فقط همان دسته را پنهان می‌کند`, () => {
      const t = first(kind)
      assert.equal(getOccasion(t.m, t.d, t.y)?.kind, kind)
      setter(false)
      assert.equal(getOccasion(t.m, t.d, t.y), undefined)
      const other = first(kind === 'n' ? 'i' : 'n'); assert.ok(getOccasion(other.m, other.d, other.y))
    })
  }
  test('تعطیلات رسمی با هر چهار کلید خاموش هم نمایش داده می‌شوند', () => {
    setReligiousDays(false); setAncientCelebrations(false); setWorldDays(false); setNationalDays(false)
    assert.equal(getOccasion(1, 13, 1405)?.holiday, true) // سیزده‌به‌در (دسته‌ی باستانی ولی تعطیل)
    assert.equal(getOccasion(4, 5, 1405)?.holiday, true) // عاشورا (مذهبی ولی تعطیل)
    assert.ok(getOccasion(1, 1, 1405)?.title.includes('نوروز'))
  })
  test('ترتیب اهمیت در یک روز: تعطیل، مذهبی، باستانی، ملی، جهانی', () => {
    const list = getOccasionList(7, 25, 1405)
    assert.ok(list.length >= 2)
    const order = list.map((c) => (c.holiday ? 0 : { r: 1, a: 2, n: 3, i: 4 }[c.kind]))
    assert.deepEqual(order, [...order].sort((a, b) => a - b))
    assert.deepEqual(getOccasion(7, 25, 1405)!.more, list.slice(1).map((c) => c.title))
  })
})

describe('فهرست مناسبت‌ها در پنل مدیریت', () => {
  test('از داده‌ی واقعی همان سال ساخته می‌شود', () => {
    const ev = buildEvents(data, 1405)
    const total = Object.values(data.years!['1405']).flat().length
    assert.equal(ev.length, total)
    assert.ok(ev.every((e) => (EVENT_TYPES as readonly string[]).includes(e.type) && e.status === 'فعال'))
    assert.ok(ev.some((e) => e.calendar_date === '۱۴۰۵/۰۷/۲۴' && e.title.includes('غذا')))
    assert.ok(ev.some((e) => e.description === 'تعطیل رسمی'))
  })
  test('سالِ بدون داده به آخرین سال موجود برمی‌گردد', () => {
    assert.ok(buildEvents(data, 1500)[0].calendar_date.startsWith('۱۴۰۶'))
  })
})
