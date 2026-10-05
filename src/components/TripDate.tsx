import type { Season } from '../data/destinations'
import { MONTHS, faNum, monthLength, shiftMonth, type JalaliDate } from '../lib/jalali'

interface Props {
  date: JalaliDate
  season: Season
  onChange: (date: JalaliDate) => void
}

// تاریخ و فصل سفر + جابه‌جایی ماه (روز در ماه جدید در صورت نیاز کوتاه می‌شود)
export default function TripDate({ date, season, onChange }: Props) {
  const go = (delta: number) => {
    const next = shiftMonth({ year: date.year, month: date.month }, delta)
    onChange({ ...next, day: Math.min(date.day, monthLength(next)) })
  }
  return (
    <section className="tp-date" aria-label="تاریخ سفر">
      <button type="button" className="tp-month-btn" onClick={() => go(-1)} aria-label="ماه قبل">›</button>
      <div className="tp-date-text">
        <span className="tp-label">تاریخ انتخاب‌شده</span>
        <strong>{faNum(date.day)} {MONTHS[date.month - 1]} {faNum(date.year)}</strong>
        <span className="tp-season">فصل: {season}</span>
      </div>
      <button type="button" className="tp-month-btn" onClick={() => go(1)} aria-label="ماه بعد">‹</button>
    </section>
  )
}
