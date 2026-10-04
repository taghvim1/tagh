import { useEffect, useMemo } from 'react'
import Calendar from '../components/Calendar'
import DateHeader from '../components/DateHeader'
import Drawer from '../components/Drawer'
import { useDarkMode } from '../lib/theme'
import '../components/calendar.css'

export default function CalendarPage() {
  const now = useMemo(() => new Date(), [])
  const [dark, setDark] = useDarkMode()

  // رنگ نوار مرورگر موبایل را با تم هماهنگ می‌کند و هنگام خروج برمی‌گرداند
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', dark ? '#0f1720' : '#ffffff')
    return () => meta?.setAttribute('content', '#ffffff')
  }, [dark])

  return (
    <div className="cal-page" data-theme={dark ? 'dark' : 'light'}>
      <section className="cal-top"><DateHeader today={now} /></section>
      <section className="cal-bottom"><Calendar today={now} /></section>
      <Drawer dark={dark} onDarkChange={setDark} />
    </div>
  )
}
