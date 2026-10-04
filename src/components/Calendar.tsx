import { useMemo, type CSSProperties } from 'react'
import { getOccasion } from '../data/occasions'
import { WEEKDAYS, buildMonthGrid, faNum, formatLongDate, isSameDate, type JalaliDate, type MonthRef } from '../lib/jalali'

interface CalendarProps {
  today: JalaliDate
  /** ماه نمایش‌داده‌شده و روز انتخاب‌شده از بیرون کنترل می‌شوند */
  view: MonthRef
  selected: JalaliDate | null
  onSelect: (date: JalaliDate) => void
}

export default function Calendar({ today, view, selected, onSelect }: CalendarProps) {
  const days = useMemo(() => buildMonthGrid(view, today), [view, today])

  return (
    <section className="calendar" aria-label="تقویم شمسی" style={{ '--rows': days.length / 7 } as CSSProperties}>
      <div className="grid weekdays" role="row">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
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
              <span className="cell-num">{faNum(date.day)}</span>
              {occ && !occ.holiday && <span className="cell-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
