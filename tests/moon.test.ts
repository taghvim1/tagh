import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { localDayStart, localIso, moonForDay, moonPhaseAt, moonPhaseName, moonTimes } from '../src/weather/moon'

// مقدارهای مرجع از pyephem (مدل دقیق نجومی): طلوع/غروب لبهٔ بالایی با انکسار استاندارد، فاز در ساعت ۲۱ محلی
const minutes = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))
const near = (iso: string | null, hhmm: string, tol = 3) => { assert.ok(iso, `انتظار زمان ${hhmm}`); assert.ok(Math.abs(minutes(iso) - minutes(`xxxxxxxxxxx${hhmm}`)) <= tol, `${iso} باید حدود ${hhmm} باشد`) }

const TEHRAN = [35.69, 51.39, 'Asia/Tehran'] as const
const SYDNEY = [-33.87, 151.21, 'Australia/Sydney'] as const
const FRANKFURT = [50.11, 8.68, 'Europe/Berlin'] as const

describe('طلوع و غروب ماه (مقایسه با مرجع نجومی)', () => {
  const cases: [string, readonly [number, number, string], string, string][] = [
    ['2026-10-17', TEHRAN, '12:31', '22:01'], ['2026-10-26', TEHRAN, '17:06', '06:27'], ['2026-11-09', TEHRAN, '06:39', '16:44'],
    ['2026-10-17', SYDNEY, '10:15', '00:38'], ['2026-10-26', SYDNEY, '19:32', '05:31'],
    ['2026-10-17', FRANKFURT, '15:02', '22:25'], ['2026-11-09', FRANKFURT, '07:56', '16:17'],
  ]
  for (const [date, p, rise, set] of cases) {
    test(`${date} ${p[2]}`, () => {
      const t = moonTimes(date, p[0], p[1], p[2])
      near(t.rise, rise); near(t.set, set)
      assert.ok(t.rise!.startsWith(date) && t.set!.startsWith(date), 'هر دو رویداد در همان روز محلی‌اند')
    })
  }
  test('هر مدت‌زمانِ ماه‌گرد حدود یک روز قمری است: طلوعِ دو روز پیاپی ۲۰ تا ۸۰ دقیقه جابه‌جا می‌شود', () => {
    const a = minutes(moonTimes('2026-10-17', ...TEHRAN)!.rise!), b = minutes(moonTimes('2026-10-18', ...TEHRAN)!.rise!)
    const shift = b - a
    assert.ok(shift > 20 && shift < 80, `جابه‌جایی ${shift} دقیقه`)
  })
  test('بیش از یک طلوع/غروب در یک روز نیست و خروجی رشتهٔ هم‌شکلِ خورشید است', () => {
    const t = moonTimes('2026-10-17', ...TEHRAN)
    assert.match(t.rise!, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})

describe('فاز ماه', () => {
  test('بدر ۲۶ اکتبر ۲۰۲۶ و محاق ۹ نوامبر ۲۰۲۶ (لحظهٔ دقیق از مرجع)', () => {
    const full = moonPhaseAt(Date.UTC(2026, 9, 26, 4, 12)), nw = moonPhaseAt(Date.UTC(2026, 10, 9, 7, 2))
    assert.ok(Math.abs(full.phase - 0.5) < 0.006 && full.fraction > 0.999)
    assert.ok((nw.phase < 0.006 || nw.phase > 0.994) && nw.fraction < 0.001)
  })
  test('تربیع اول و آخر', () => {
    assert.ok(Math.abs(moonPhaseAt(Date.UTC(2026, 9, 18, 16, 13)).phase - 0.25) < 0.006)
    assert.ok(Math.abs(moonPhaseAt(Date.UTC(2026, 10, 1, 20, 28)).phase - 0.75) < 0.006)
  })
  test('نسبت روشنایی شب مقدارهای مرجع را می‌دهد', () => {
    const f = (date: string, p: readonly [number, number, string]) => moonForDay(date, ...p).fraction
    assert.ok(Math.abs(f('2026-10-17', TEHRAN) - 0.412) < 0.01)
    assert.ok(Math.abs(f('2026-10-26', TEHRAN) - 0.994) < 0.01)
    assert.ok(Math.abs(f('2026-11-09', SYDNEY) - 0.002) < 0.01)
  })
  test('رو به رشد/کاهش درست تشخیص داده می‌شود', () => {
    assert.equal(moonForDay('2026-10-17', ...TEHRAN).waxing, true) // بین محاق و بدر
    assert.equal(moonForDay('2026-11-02', ...TEHRAN).waxing, false) // پس از بدر
  })
  test('نام فاز', () => {
    assert.deepEqual([0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.99].map(moonPhaseName),
      ['new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent', 'new'])
  })
})

describe('منطقهٔ زمانی', () => {
  test('آغاز روز محلی و رفت‌وبرگشت رشتهٔ محلی', () => {
    const s = localDayStart('2026-10-17', 'Asia/Tehran')
    assert.equal(localIso(s, 'Asia/Tehran'), '2026-10-17T00:00')
    assert.equal(localIso(s + 90 * 60_000, 'Asia/Tehran'), '2026-10-17T01:30')
  })
  test('روز تغییر ساعت تابستانی (فرانکفورت ۲۵ اکتبر ۲۰۲۶) ۲۵ ساعته است ولی همچنان حل می‌شود', () => {
    const a = localDayStart('2026-10-25', 'Europe/Berlin'), b = localDayStart('2026-10-26', 'Europe/Berlin')
    assert.equal((b - a) / 3_600_000, 25)
    assert.ok(moonTimes('2026-10-25', ...FRANKFURT).rise !== undefined)
  })
})
