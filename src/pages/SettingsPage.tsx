import { useState } from 'react'
import { disableDateNotification, enableDateNotification, notificationState, type EnableResult } from '../lib/dateNotification'
import { navigate } from '../lib/router'
import AppChrome from '../components/AppChrome'
import { setAncientCelebrations, setWeatherCard, setWeekHaptics, useAncientCelebrations, useDateNotification, useWeatherCard, useWeekHaptics } from '../lib/settings'
import { weatherStore } from '../weather/current/store'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// تنظیمات کاربر: هر تغییر بلافاصله ذخیره می‌شود. عنوان هر گزینه به‌تنهایی کافی است.
export default function SettingsPage() {
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)
  const ancient = useAncientCelebrations()
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
            <span>آیین‌ها و جشن‌های باستانی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={ancient} onChange={(e) => setAncientCelebrations(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>کارت آب‌وهوا</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={weather} onChange={(e) => { setWeatherCard(e.target.checked); if (!e.target.checked) weatherStore.clear() }} />
          </label>
          <label className="st-row">
            <span>لرزش هنگام حرکت تقویم هفتگی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={haptics} onChange={(e) => setWeekHaptics(e.target.checked)} />
          </label>
          <label className="st-row">
            <span>نمایش تاریخ در نوار اعلان</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={dateNotif && notificationState() === 'granted'} onChange={(e) => void toggleDate(e.target.checked)} />
          </label>
        </div>
        {notifMsg && <p className="st-hint" role="alert">{notifMsg}</p>}
        <p className="st-hint">مرورگر اجازهٔ اعلانِ «غیرقابل‌حذف» به وب‌اپ نمی‌دهد: ممکن است کنار زده شود و اگر چند روز برنامه را باز نکنید تاریخ قدیمی بماند (به‌روزرسانی پس‌زمینه به مرورگر بستگی دارد). اعلان واقعاً دائمی به نسخهٔ اندرویدی نیاز دارد.</p>
        <div className="st-list">
          <button type="button" className="st-row st-link" onClick={() => navigate('/privacy')}>
            <span>حریم خصوصی و رضایت</span><span aria-hidden="true">‹</span>
          </button>
        </div>
      </main>
    </div>
  )
}
