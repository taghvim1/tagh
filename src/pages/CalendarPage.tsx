import { useMemo, useState } from 'react'
import Calendar from '../components/Calendar'
import DateHeader from '../components/DateHeader'
import Drawer from '../components/Drawer'
import OccasionRow from '../components/OccasionRow'
import { fromGregorian, shiftMonth, type JalaliDate, type MonthRef } from '../lib/jalali'
import { getSelectedDate, setSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

export default function CalendarPage() {
  const now = useMemo(() => new Date(), [])
  const today = useMemo(() => fromGregorian(now), [now])
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)

  // اگر کاربر از صفحهٔ دیگری برگشته، همان روز انتخاب‌شده قبلی باز می‌ماند؛ در غیر این صورت امروز
  const [selected, setSelected] = useState<JalaliDate>(() => getSelectedDate() ?? today)
  const [view, setView] = useState<MonthRef>(() => ({ year: selected.year, month: selected.month }))

  const select = (date: JalaliDate) => {
    setSelected(date)
    setSelectedDate(date)
    setView({ year: date.year, month: date.month })
  }

  return (
    <div className="cal-page" data-theme={dark ? 'dark' : 'light'}>
      <section className="cal-top"><DateHeader today={now} /></section>
      <OccasionRow view={view} selected={selected} onPrev={() => setView((v) => shiftMonth(v, -1))} onNext={() => setView((v) => shiftMonth(v, 1))} />
      <section className="cal-bottom"><Calendar today={today} view={view} selected={selected} onSelect={select} /></section>
      <Drawer dark={dark} onDarkChange={setDark} onToday={() => select(today)} />
    </div>
  )
}
