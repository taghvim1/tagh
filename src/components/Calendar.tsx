import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { getOccasion } from '../lib/calendarData'
import { WEEKDAYS, buildMonthGrid, faNum, formatLongDate, isSameDate, toGregorianDate, type JalaliDate, type MonthRef } from '../lib/jalali'
import type { TourDayMap } from '../tours/calendar'
import { noteKey } from '../lib/notes'
import { toISO } from '../tours/logic'

interface CalendarProps {
  today: JalaliDate
  /** ماه نمایش‌داده‌شده و روز انتخاب‌شده از بیرون کنترل می‌شوند */
  view: MonthRef
  selected: JalaliDate | null
  onSelect: (date: JalaliDate) => void
  /** روزهای دارای تور (از روی تورها محاسبه می‌شود)؛ هر روز با دایرهٔ خاکستریِ توپر مشخص می‌شود */
  tourDays?: TourDayMap
  /** یادداشت‌ها (کلید = noteKey)؛ عدد روزِ دارای یادداشت خط زیرین می‌گیرد */
  notes?: Record<string, string>
  /** نگه‌داشتن انگشت روی یک روز به‌مدت LONG_PRESS_MS */
  onLongPress?: (date: JalaliDate) => void
}

export const LONG_PRESS_MS = 2000
const MOVE_TOLERANCE = 12

export default function Calendar({ today, view, selected, onSelect, tourDays, notes, onLongPress }: CalendarProps) {
  const days = useMemo(() => buildMonthGrid(view, today), [view, today])

  // نگه‌داشتن ۲ ثانیه‌ای: یادداشت همان روز باز می‌شود و کلیکِ پس از رها‌کردن نادیده گرفته می‌شود
  const press = useRef<{ timer: number; x: number; y: number } | null>(null)
  const fired = useRef(false)
  const cancel = () => { if (press.current) { window.clearTimeout(press.current.timer); press.current = null } }
  useEffect(() => cancel, [])
  const start = (e: React.PointerEvent, date: JalaliDate) => {
    if (!onLongPress || (e.pointerType === 'mouse' && e.button !== 0)) return
    cancel(); fired.current = false
    press.current = { x: e.clientX, y: e.clientY, timer: window.setTimeout(() => { fired.current = true; press.current = null; onLongPress(date) }, LONG_PRESS_MS) }
  }
  const move = (e: React.PointerEvent) => {
    const p = press.current
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_TOLERANCE) cancel()
  }
  const click = (date: JalaliDate) => { if (fired.current) { fired.current = false; return } onSelect(date) }

  return (
    <section className="calendar" aria-label="تقویم شمسی" style={{ '--rows': days.length / 7 } as CSSProperties}>
      <div className="grid weekdays" role="row">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
      </div>

      <div className="grid days">
        {days.map(({ date, inMonth, isFriday, isToday }) => {
          const occ = inMonth ? getOccasion(date.month, date.day) : undefined
          const isSelected = !!selected && isSameDate(date, selected)
          const tours = tourDays?.get(toISO(toGregorianDate(date)))
          const base = occ ? `${formatLongDate(date)} — ${occ.title}${occ.holiday ? ' (تعطیل)' : ''}` : formatLongDate(date)
          const hasNote = !!notes?.[noteKey(date)]
          const label = `${base}${tours ? ' — دارای تور' : ''}${hasNote ? ' — دارای یادداشت' : ''}`
          const cls = ['cell', isFriday && 'off', !inMonth && 'adjacent', isToday && 'now', isSelected && 'selected', occ?.holiday && 'holiday', tours && 'has-tour', hasNote && 'has-note'].filter(Boolean).join(' ')
          return (
            <button key={`${date.month}-${date.day}`} type="button" className={cls} aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined}
              aria-label={label} title={label} onClick={() => click(date)}
              onPointerDown={(e) => start(e, date)} onPointerMove={move} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={(e) => e.preventDefault()}>
              <span className="cell-num">{faNum(date.day)}</span>
              {occ && !occ.holiday && <span className="cell-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
