import { useMemo, useState, type CSSProperties } from 'react'
import { getOccasion } from '../data/occasions'
import { MONTHS, WEEKDAYS, buildMonthGrid, faNum, formatLongDate, fromGregorian, isSameDate, shiftMonth, type JalaliDate, type MonthRef } from '../lib/jalali'

interface CalendarProps {
  /** تاریخ «امروز»؛ پیش‌فرض تاریخ دستگاه */
  today?: Date
  /** روز انتخاب‌شده (کنترل‌شده از بیرون تا بخش اطلاعات مناسبت هم از آن استفاده کند) */
  selected: JalaliDate | null
  onSelect: (date: JalaliDate) => void
}

export default function Calendar({ today: todayProp, selected, onSelect }: CalendarProps) {
  const today = useMemo(() => fromGregorian(todayProp ?? new Date()), [todayProp])
  const todayMonth: MonthRef = { year: today.year, month: today.month }
  const [view, setView] = useState<MonthRef>(todayMonth)

  const days = useMemo(() => buildMonthGrid(view, today), [view, today])
  const isTodayMonth = view.year === today.year && view.month === today.month

  return (
    <section className="calendar" aria-label="تقویم شمسی" style={{ '--rows': days.length / 7 } as CSSProperties}>
      <div className="head">
        <div className="title">
          <h2>{MONTHS[view.month - 1]}</h2>
          <span className="year">{faNum(view.year)}</span>
        </div>
        <nav className="nav" aria-label="پیمایش ماه">
          <button onClick={() => setView((v) => shiftMonth(v, -1))} aria-label="ماه قبل">›</button>
          <button className="today" onClick={() => setView(todayMonth)} disabled={isTodayMonth}>امروز</button>
          <button onClick={() => setView((v) => shiftMonth(v, 1))} aria-label="ماه بعد">‹</button>
        </nav>
      </div>

      <div className="grid weekdays" role="row">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={i === 6 ? 'off' : ''} title={w}>
            <span className="full">{w}</span>
            <span className="short">{w[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid days">
        {days.map(({ date, inMonth, isFriday, isToday }) => {
          const occ = inMonth ? getOccasion(date.month, date.day) : undefined
          const isSelected = !!selected && isSameDate(date, selected)
          const label = occ ? `${formatLongDate(date)} — ${occ.title}${occ.holiday ? ' (تعطیل)' : ''}` : formatLongDate(date)
          const cls = ['cell', isFriday && 'off', !inMonth && 'adjacent', isToday && 'now', isSelected && 'selected', occ?.holiday && 'holiday'].filter(Boolean).join(' ')
          return (
            <button key={`${date.month}-${date.day}`} type="button" className={cls} aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined}
              aria-label={label} title={label} onClick={() => onSelect(date)}>
              {occ && <span className="cell-title">{occ.title}</span>}
              <span className="cell-num">{faNum(date.day)}</span>
              {occ && !occ.holiday && <span className="cell-tri" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
