import { useEffect, useMemo, useState } from 'react'
import Calendar from '../components/Calendar'
import DateHeader from '../components/DateHeader'
import Drawer from '../components/Drawer'
import OccasionInfo from '../components/OccasionInfo'
import type { JalaliDate } from '../lib/jalali'
import { useDarkMode } from '../lib/theme'
import '../components/calendar.css'

export default function CalendarPage() {
  const now = useMemo(() => new Date(), [])
  const [dark, setDark] = useDarkMode()
  const [selected, setSelected] = useState<JalaliDate | null>(null)

  // رنگ نوار مرورگر موبایل را با تم هماهنگ می‌کند و هنگام خروج برمی‌گرداند
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', dark ? '#0f1720' : '#ffffff')
    return () => meta?.setAttribute('content', '#ffffff')
  }, [dark])

  return (
    <div className="cal-page" data-theme={dark ? 'dark' : 'light'}>
      <section className="cal-top"><DateHeader today={now} /></section>
      <OccasionInfo selected={selected} />
      <section className="cal-bottom"><Calendar today={now} selected={selected} onSelect={setSelected} /></section>
      <Drawer dark={dark} onDarkChange={setDark} />
    </div>
  )
}
