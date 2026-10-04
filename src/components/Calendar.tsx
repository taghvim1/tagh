import { useMemo, useState } from 'react'
import { getOccasion } from '../data/occasions'
import { MONTHS, WEEKDAYS, buildMonthGrid, faNum, formatLongDate, fromGregorian, shiftMonth, type MonthRef } from '../lib/jalali'

interface CalendarProps {
  /** تاریخ «امروز»؛ پیش‌فرض تاریخ دستگاه */
  today?: Date
}

export default function Calendar({ today: todayProp }: CalendarProps) {
  const today = useMemo(() => fromGregorian(todayProp ?? new Date()), [todayProp])
  const todayMonth: MonthRef = { year: today.year, month: today.month }
  const [view, setView] = useState<MonthRef>(todayMonth)

  const days = useMemo(() => buildMonthGrid(view, today), [view, today])
  const isTodayMonth = view.year === today.year && view.month === today.month

  return (
    <section className="calendar" aria-label="تقویم شمسی">
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
          const cls = ['cell', isFriday && 'off', !inMonth && 'adjacent', isToday && 'now', occ?.holiday && 'holiday'].filter(Boolean).join(' ')
          return (
            <div key={`${date.month}-${date.day}`} className={cls} aria-current={isToday ? 'date' : undefined}
              title={occ ? `${formatLongDate(date)} — ${occ.title}${occ.holiday ? ' (تعطیل)' : ''}` : formatLongDate(date)}>
              {occ && <span className="cell-title">{occ.title}</span>}
              <span className="cell-num">{faNum(date.day)}</span>
              {occ && !occ.holiday && <span className="cell-dot" aria-hidden="true" />}
              {occ?.holiday && <span className="sr-only">تعطیل</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
