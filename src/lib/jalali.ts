// منطق تاریخ شمسی؛ مستقل از UI. محاسبات روی کتابخانهٔ jalaali-js است.
import { isLeapJalaaliYear, jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js'

export interface JalaliDate { year: number; month: number; day: number }
export interface MonthRef { year: number; month: number }
export interface CalendarDay {
  date: JalaliDate
  inMonth: boolean
  isFriday: boolean
  isToday: boolean
}

export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] as const
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const

export const faNum = (n: number) => n.toLocaleString('fa-IR', { useGrouping: false })

export const fromGregorian = (d: Date): JalaliDate => {
  const { jy, jm, jd } = toJalaali(d)
  return { year: jy, month: jm, day: jd }
}

export const toGregorianDate = ({ year, month, day }: JalaliDate): Date => {
  const { gy, gm, gd } = toGregorian(year, month, day)
  return new Date(gy, gm - 1, gd, 12)
}

export const monthLength = ({ year, month }: MonthRef) => jalaliMonthLength(year, month)
const jalaliMonthLength = jalaaliMonthLength
export const isLeapYear = isLeapJalaaliYear

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const idx = year * 12 + (month - 1) + delta
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

/** شنبه = ۰ ... جمعه = ۶ */
export const weekdayIndex = (d: JalaliDate) => (toGregorianDate(d).getDay() + 1) % 7

export const isSameDate = (a: JalaliDate, b: JalaliDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day

export const formatLongDate = (d: JalaliDate) =>
  `${WEEKDAYS[weekdayIndex(d)]} ${faNum(d.day)} ${MONTHS[d.month - 1]} ${faNum(d.year)}`

/** جدول کامل هفته‌ها (مضرب ۷) با روزهای ماه قبل و بعد برای تکمیل جدول */
export function buildMonthGrid(ref: MonthRef, today: JalaliDate): CalendarDay[] {
  const length = monthLength(ref)
  const lead = weekdayIndex({ ...ref, day: 1 })
  const prev = shiftMonth(ref, -1)
  const next = shiftMonth(ref, 1)
  const prevLength = monthLength(prev)
  const total = Math.ceil((lead + length) / 7) * 7

  return Array.from({ length: total }, (_, i) => {
    let date: JalaliDate
    let inMonth = true
    if (i < lead) {
      date = { ...prev, day: prevLength - lead + i + 1 }
      inMonth = false
    } else if (i < lead + length) {
      date = { ...ref, day: i - lead + 1 }
    } else {
      date = { ...next, day: i - lead - length + 1 }
      inMonth = false
    }
    return { date, inMonth, isFriday: i % 7 === 6, isToday: isSameDate(date, today) }
  })
}
