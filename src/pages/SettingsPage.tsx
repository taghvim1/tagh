import { useState } from 'react'
import { disableDateNotification, enableDateNotification, notificationState, type EnableResult } from '../lib/dateNotification'
import AppChrome from '../components/AppChrome'
import { setAncientCelebrations, setNationalDays, setReligiousDays, setWeatherCard, setWeekHaptics, setWorldDays, useAncientCelebrations, useDateNotification, useNationalDays, useReligiousDays, useWeatherCard, useWeekHaptics, useWorldDays } from '../lib/settings'
import { weatherStore } from '../weather/current/store'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// تنظیمات کاربر: هر تغییر بلافاصله ذخیره می‌شود. عنوان هر گزینه به‌تنهایی کافی است.
export default function SettingsPage() {
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)
  const ancient = useAncientCelebrations()
  const worldDays = useWorldDays()
  const religious = useReligiousDays()
  const national = useNationalDays()
  const weather = useWeatherCard()
  const dateNotif = useDateNotification()
  const haptics = useWeekHaptics()
  const [notifMsg, setNotifMsg] = useState('')
  const NOTIF_MSG: Record<EnableResult, string> = {
    ok: '', denied: 'اجازهٔ اعلان در مرورگر مسدود است. از تنظیمات مرورگر (یا برنامهٔ نصب‌شده) بخش «اعلان‌ها»ی این سایت را روی «اجازه» بگذارید و دوباره روشن کنید.',
    unsupported: 'این مرورگر یا حالت اجرا اعلان را پشتیبانی نمی‌کند. برنامه را نصب کنید (افزودن به صفحهٔ اصلی) و دوباره امتحان کنید.',
    insecure: 'اعلان فقط در اتصال امن (HTTPS) کار می‌کند.', dismissed: 'اجازه داده نشد؛ هر وقت خواستید دوباره روشن کنید.',
  }
  const toggleDate = async (on: boolean) => {
    setNotifMsg('')
    if (!on) { await disableDateNotification(); return }
    const r = await enableDateNotification(); setNotifMsg(NOTIF_MSG[r])
  }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head"><h1>تنظیمات</h1></header>
        <div className="st-list">
          <label className="st-row">
            <span>حالت تاریک</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>نمایش تاریخ در نوار اعلان</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={dateNotif && notificationState() === 'granted'} onChange={(e) => void toggleDate(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>مناسبت‌های مذهبی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={religious} onChange={(e) => setReligiousDays(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>مناسبت‌های باستانی و آیینی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={ancient} onChange={(e) => setAncientCelebrations(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>مناسبت‌های جهانی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={worldDays} onChange={(e) => setWorldDays(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>مناسبت‌های ملی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={national} onChange={(e) => setNationalDays(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>کاشی آب‌وهوا</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={weather} onChange={(e) => { setWeatherCard(e.target.checked); if (!e.target.checked) weatherStore.clear() }} />
          </label>
          <label className="st-row">
            <span>لرزش هنگام حرکت تقویم هفتگی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={haptics} onChange={(e) => setWeekHaptics(e.target.checked)} />
          </label>
        </div>
        {notifMsg && <p className="st-hint" role="alert">{notifMsg}</p>}
      </main>
    </div>
  )
}
