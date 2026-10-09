import { useMemo, useState } from 'react'
import Calendar from '../components/Calendar'
import DateHeader from '../components/DateHeader'
import AppChrome from '../components/AppChrome'
import OccasionRow from '../components/OccasionRow'
import CenterModal from '../components/CenterModal'
import { useCalendarData } from '../lib/calendarData'
import { fromGregorian, shiftMonth, toGregorianDate, type JalaliDate, type MonthRef } from '../lib/jalali'
import { useAncientCelebrations } from '../lib/settings'
import { useOverlay } from '../lib/overlay'
import { navigate } from '../lib/router'
import { getSelectedDate, setSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { useTourDays } from '../tours/calendar'
import { toISO } from '../tours/logic'
import TourDayPopup from '../tours/TourDayPopup'
import type { Tour } from '../tours/types'

export default function CalendarPage() {
  const now = useMemo(() => new Date(), [])
  const today = useMemo(() => fromGregorian(now), [now])
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  useAncientCelebrations() // تغییر تنظیم آیین‌های باستانی بلافاصله روی تقویم اعمال می‌شود
  useCalendarData() // با رسیدن داده‌های جدید تقویم دوباره رندر می‌شود

  // اگر کاربر از صفحهٔ دیگری برگشته، همان روز انتخاب‌شده قبلی باز می‌ماند؛ در غیر این صورت امروز
  const [selected, setSelected] = useState<JalaliDate>(() => getSelectedDate() ?? today)
  const [view, setView] = useState<MonthRef>(() => ({ year: selected.year, month: selected.month }))

  const tourDays = useTourDays()
  const popup = useOverlay('tour-day')
  const selectedIso = toISO(toGregorianDate(selected))
  const dayTours = tourDays.get(selectedIso) ?? []

  const select = (date: JalaliDate) => {
    setSelected(date)
    setSelectedDate(date)
    setView({ year: date.year, month: date.month })
  }
  // لمس روزِ دارای تور: انتخاب روز + پنجرهٔ تور (انتخاب از دکمهٔ «امروز» پنجره باز نمی‌کند)
  const tapDay = (date: JalaliDate) => {
    select(date)
    if (tourDays.has(toISO(toGregorianDate(date)))) popup.show()
  }
  const openTour = (t: Tour) => { popup.hideSilently(); navigate(`/tours/${t.id}`) }

  return (
    <div className="cal-page" data-theme={dark ? 'dark' : 'light'}>
      <section className="cal-top"><DateHeader today={now} /></section>
      <OccasionRow view={view} selected={selected} onPrev={() => setView((v) => shiftMonth(v, -1))} onNext={() => setView((v) => shiftMonth(v, 1))} />
      <section className="cal-bottom"><Calendar today={today} view={view} selected={selected} onSelect={tapDay} tourDays={tourDays} /></section>
      <AppChrome home overlay onToday={() => select(today)} />
      <CenterModal open={popup.open && dayTours.length > 0} onClose={popup.hide} label="تورهای این روز">
        {dayTours.length > 0 && <TourDayPopup dateIso={selectedIso} tours={dayTours} onOpenTour={openTour} />}
      </CenterModal>
    </div>
  )
}
