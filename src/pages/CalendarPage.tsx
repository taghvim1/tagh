import { useMemo, useState } from 'react'
import Calendar from '../components/Calendar'
import WeatherCard from '../components/WeatherCard'
import DateHeader from '../components/DateHeader'
import AppChrome from '../components/AppChrome'
import OccasionRow from '../components/OccasionRow'
import CenterModal from '../components/CenterModal'
import NotePopup from '../components/NotePopup'
import WeekView from '../components/WeekView'
import { useCalendarData } from '../lib/calendarData'
import { dayNumber, fromGregorian, shiftMonth, toGregorianDate, type JalaliDate, type MonthRef } from '../lib/jalali'
import { useAncientCelebrations, useWeatherCard } from '../lib/settings'
import { useOverlay } from '../lib/overlay'
import { useAnimatedMount } from '../lib/useAnimatedMount'
import { useHSwipe } from '../lib/useSwipe'
import { useNotes } from '../lib/notes'
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
  const weatherOn = useWeatherCard()
  const ancient = useAncientCelebrations() // تغییر تنظیم آیین‌های باستانی بلافاصله روی تقویم اعمال می‌شود
  const calData = useCalendarData() // با رسیدن داده‌های جدید تقویم دوباره رندر می‌شود

  // اگر کاربر از صفحهٔ دیگری برگشته، همان روز انتخاب‌شده قبلی باز می‌ماند؛ در غیر این صورت امروز
  const [selected, setSelected] = useState<JalaliDate>(() => getSelectedDate() ?? today)
  const [view, setView] = useState<MonthRef>(() => ({ year: selected.year, month: selected.month }))

  // کشیدن تقویم ماهانه به چپ ⇒ تقویم هفتگی (۹ لاین)؛ کشیدن به راست یا زدن عنوان ماه ⇒ بازگشت
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const weekPane = useAnimatedMount(mode === 'week', 340)
  const [weekStart, setWeekStart] = useState<JalaliDate>(today)

  const tourDays = useTourDays()
  const popup = useOverlay('tour-day')
  const note = useOverlay('note')
  const notes = useNotes()
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
  // نگه‌داشتن ۱ ثانیه‌ای روی یک روز: همان روز انتخاب می‌شود و یادداشتش باز می‌شود
  const longPress = (date: JalaliDate) => { select(date); note.show() }
  const enterWeek = () => {
    // اولین لاین: روز انتخاب‌شده اگر در ماه نمایش‌داده‌شده است؛ وگرنه امروز (اگر همان ماه است) یا روز اول ماه
    const inView = selected.year === view.year && selected.month === view.month
    const todayView = today.year === view.year && today.month === view.month
    setWeekStart(inView ? selected : todayView ? today : { ...view, day: 1 })
    setMode('week')
  }
  const exitWeek = (first: JalaliDate) => {
    const f = dayNumber(first), s = dayNumber(selected)
    select(s >= f && s <= f + 6 ? selected : first) // روز انتخاب‌شده اگر دیده نمی‌شود، اولین روز هفته انتخاب می‌شود
    setMode('month')
  }
  const swipeMonth = useHSwipe(enterWeek)
  const weekTours = (d: JalaliDate) => { select(d); popup.show() }
  const weekNote = (d: JalaliDate) => { select(d); note.show() }
  const openTour = (t: Tour) => { popup.hideSilently(); navigate(`/tours/${t.id}`) }

  return (
    <div className="cal-page" data-theme={dark ? 'dark' : 'light'}>
      <section className={`cal-top${weatherOn ? ' has-wx' : ''}`}>{weatherOn && <WeatherCard />}<DateHeader today={now} /></section>
      <div className={`cal-swap ${mode}`}>
        <div className="cal-pane cal-month" aria-hidden={mode === 'week'}>
          <OccasionRow view={view} selected={selected} onPrev={() => setView((v) => shiftMonth(v, -1))} onNext={() => setView((v) => shiftMonth(v, 1))} />
          <section className="cal-bottom" {...swipeMonth}><Calendar today={today} view={view} selected={selected} onSelect={tapDay} tourDays={tourDays} notes={notes} onLongPress={longPress} /></section>
        </div>
        {weekPane.mounted && (
          <div className={`cal-pane cal-weekpane${weekPane.shown ? ' shown' : ''}`}>
            <WeekView today={today} startDate={weekStart} selected={selected} tourDays={tourDays} notes={notes} rev={`${calData.updatedAt}-${ancient}`}
              onSelect={select} onNote={weekNote} onTours={weekTours} onBack={exitWeek} />
          </div>
        )}
      </div>
      <AppChrome home overlay onToday={() => select(today)} />
      <NotePopup open={note.open} onClose={note.hide} date={selected} />
      <CenterModal open={popup.open && dayTours.length > 0} onClose={popup.hide} label="تورهای این روز">
        {dayTours.length > 0 && <TourDayPopup dateIso={selectedIso} tours={dayTours} onOpenTour={openTour} carousel={mode === 'week'} />}
      </CenterModal>
    </div>
  )
}
