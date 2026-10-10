import { useState } from 'react'
import { tracker, useAnalytics } from '../analytics'
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
  const an = useAnalytics()
  const [shown, setShown] = useState<string | null>(null)

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
        <h2 className="st-sub">حریم خصوصی</h2>
        <div className="st-list">
          <label className="st-row">
            <span>تحلیل ناشناس استفاده از برنامه</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={an.consent.analytics} onChange={(e) => tracker.setConsent('analytics', e.target.checked)} />
          </label>
          <label className="st-row">
            <span>دریافت پیشنهادهای تبلیغاتی</span>
            <input type="checkbox" role="switch" className="cal-switch" checked={an.consent.marketing} onChange={(e) => tracker.setConsent('marketing', e.target.checked)} />
          </label>
        </div>
        <p className="st-hint">
          با روشن‌بودن تحلیل، فقط رویدادهای کلی (مثل مشاهدهٔ مقصد یا فصل) با یک شناسهٔ تصادفی روی همین دستگاه ثبت می‌شود؛ نه نام، نه موقعیت و نه متن جست‌وجو. اکنون سرویس دریافتی وجود ندارد، پس چیزی از دستگاه خارج نمی‌شود{an.pending > 0 ? ` (${an.pending} رویداد در صف همین دستگاه)` : ''}.
        </p>
        <div className="st-actions">
          <button type="button" className="tp-btn" onClick={() => setShown(shown ? null : JSON.stringify(tracker.exportMyData(), null, 2))}>{shown ? 'پنهان‌کردن داده‌ها' : 'مشاهدهٔ داده‌های من'}</button>
          <button type="button" className="tp-btn" onClick={() => { if (window.confirm('همهٔ داده‌های تحلیلی این دستگاه پاک و درخواست حذف ثبت شود؟')) { tracker.deleteMyData(); setShown(null) } }}>درخواست حذف داده‌ها</button>
        </div>
        {an.deletion && <p className="st-hint">درخواست حذف ثبت شد و پس از اتصال به سرور پیگیری می‌شود.</p>}
        {shown && <pre className="st-data" dir="ltr">{shown}</pre>}
      </main>
    </div>
  )
}
