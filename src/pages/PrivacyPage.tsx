import { useEffect, useState } from 'react'
import { tracker, useAnalytics } from '../analytics'
import AppChrome from '../components/AppChrome'
import { CONSENT_TEXT, PERMISSION_TEXT } from '../components/consentText'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

type Perm = 'granted' | 'denied' | 'default' | 'unsupported'
const readPerm = (): Perm => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

// حریم خصوصی و رضایت: مرور و لغو هر رضایت، وضعیت اجازهٔ اعلان مرورگر، مشاهده و حذف داده‌ها
export default function PrivacyPage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const an = useAnalytics()
  const [shown, setShown] = useState<string | null>(null)
  const [perm, setPerm] = useState<Perm>(readPerm)
  useEffect(() => { const f = () => setPerm(readPerm()); window.addEventListener('focus', f); return () => window.removeEventListener('focus', f) }, [])

  // فقط با کلیک کاربر و فقط وقتی هنوز تصمیمی نگرفته (بدون درخواست مکرر)
  const askBrowser = async () => {
    if (perm !== 'default') return
    try { setPerm((await Notification.requestPermission()) as Perm) } catch { setPerm(readPerm()) }
    void tracker.syncPermissions()
  }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/settings" />
      <main className="tp-main">
        <header className="tp-head"><h1>حریم خصوصی و رضایت</h1></header>
        <div className="st-list">
          {(['analytics', 'marketing'] as const).map((k) => (
            <label key={k} className="cs-row">
              <span><strong>{CONSENT_TEXT[k].title}</strong><small>{CONSENT_TEXT[k].text}</small></span>
              <input type="checkbox" role="switch" className="cal-switch" checked={an.consent[k]} onChange={(e) => tracker.setConsent(k, e.target.checked, 'privacy_page')} />
            </label>
          ))}
        </div>
        <p className="st-hint">داده‌ها اول روی همین دستگاه ذخیره می‌شوند و با اتصال به اینترنت به سرور ارسال می‌شوند{an.pending > 0 ? ` (${an.pending} رویداد در صف ارسال)` : ''}. با خاموش‌کردن هر مورد، ثبت و ارسال مربوط به آن بلافاصله متوقف می‌شود و انتخاب شما هم به سرور اعلام می‌شود.</p>

        <h2 className="st-sub">مجوزهای دستگاه</h2>
        <div className="st-list">
          {(['notifications', 'location'] as const).map((k) => (
            <div key={k} className="cs-row">
              <span><strong>{PERMISSION_TEXT[k].title}: {an.consent[k] ? 'فعال (مجوز داده شده)' : 'غیرفعال'}</strong><small>{PERMISSION_TEXT[k].text}</small></span>
            </div>
          ))}
        </div>

        <h2 className="st-sub">اجازهٔ اعلان مرورگر</h2>
        <div className="st-list"><div className="cs-row">
          <span><strong>{perm === 'granted' ? 'اجازه داده شده است' : perm === 'denied' ? 'مسدود شده است' : perm === 'unsupported' ? 'در این مرورگر پشتیبانی نمی‌شود' : 'هنوز پرسیده نشده'}</strong>
            <small>همین اجازه مبنای رضایت «اعلان‌ها» است. اعلان پس‌زمینهٔ واقعی (Push) هنوز فعال نیست.</small></span>
          {perm === 'default' && <button type="button" className="tp-btn" onClick={askBrowser}>درخواست اجازه</button>}
        </div></div>
        {perm === 'denied' && <p className="st-hint">اجازه از طرف مرورگر مسدود شده و برنامه نمی‌تواند دوباره بپرسد. برای فعال‌سازی، در تنظیمات مرورگر یا برنامهٔ نصب‌شده، بخش «اعلان‌ها»ی همین سایت را روی «اجازه» بگذارید.</p>}

        <h2 className="st-sub">داده‌های من</h2>
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
