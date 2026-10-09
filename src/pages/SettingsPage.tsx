import AppChrome from '../components/AppChrome'
import { setAncientCelebrations, setWeatherCard, useAncientCelebrations, useWeatherCard } from '../lib/settings'
import { weatherStore } from '../weather/current/store'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// تنظیمات کاربر: هر تغییر بلافاصله ذخیره می‌شود. عنوان هر گزینه به‌تنهایی کافی است.
export default function SettingsPage() {
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)
  const ancient = useAncientCelebrations()
  const weather = useWeatherCard()

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
        </div>
      </main>
    </div>
  )
}
