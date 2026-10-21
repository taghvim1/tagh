import { useEffect, useState } from 'react'
import { deleteAccount, logout, refreshAuth, saveProfile, useAuth } from '../auth/client'
import AppChrome from '../components/AppChrome'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { LoginFlow } from './LoginPage'

// «پروفایل»: بدون ورود ← ثبت‌نام/ورود با شماره؛ پس از ورود ← تکمیل مشخصات (نام، نام خانوادگی، شهر، ایمیل اختیاری) + خروج و حذف حساب.
export default function ProfilePage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const auth = useAuth()
  useEffect(() => { void refreshAuth() }, [])
  const u = auth.user
  const [f, setF] = useState({ first_name: '', last_name: '', city: '', email: '' })
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => { if (u?.profile) setF({ first_name: u.profile.first_name, last_name: u.profile.last_name, city: u.profile.city, email: u.profile.email ?? '' }) }, [u?.id, u?.profile?.first_name, u?.profile?.last_name, u?.profile?.city, u?.profile?.email])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((x) => ({ ...x, [k]: e.target.value })); setMsg(null) }
  const complete = u?.profile_complete === true

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.first_name.trim() || !f.last_name.trim() || !f.city.trim()) { setMsg({ ok: false, text: 'نام، نام خانوادگی و شهر را وارد کنید.' }); return }
    setBusy(true)
    const r = await saveProfile({ first_name: f.first_name.trim(), last_name: f.last_name.trim(), city: f.city.trim(), ...(f.email.trim() ? { email: f.email.trim() } : {}) })
    setBusy(false)
    setMsg(r.ok ? { ok: true, text: 'پروفایل ذخیره شد.' } : { ok: false, text: r.error === 'network' ? 'ارتباط با سرور برقرار نشد.' : r.error === 'unauthorized' ? 'نشست شما تمام شده؛ دوباره وارد شوید.' : 'اطلاعات معتبر نیست (ایمیل را بررسی کنید).' })
  }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="پروفایل" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head"><h1>{auth.status === 'in' ? (complete ? 'پروفایل من' : 'تکمیل پروفایل') : 'ورود / ثبت‌نام'}</h1></header>
        {auth.status !== 'in' || !u ? (
          auth.status === 'unknown' ? <p className="st-hint">در حال بررسی…</p> : <LoginFlow />
        ) : (
          <form className="lg-card" onSubmit={submit} noValidate>
            <p>شمارهٔ شما: <strong dir="ltr">{u.phone_masked}</strong></p>
            {!complete && <p className="st-hint">برای تکمیل حساب، مشخصات زیر را وارد کنید.</p>}
            <label className="lg-field">نام<input className="lg-input lg-text" autoComplete="given-name" maxLength={60} value={f.first_name} onChange={set('first_name')} /></label>
            <label className="lg-field">نام خانوادگی<input className="lg-input lg-text" autoComplete="family-name" maxLength={60} value={f.last_name} onChange={set('last_name')} /></label>
            <label className="lg-field">شهر محل سکونت<input className="lg-input lg-text" autoComplete="address-level2" maxLength={60} value={f.city} onChange={set('city')} /></label>
            <label className="lg-field">ایمیل (اختیاری)<input className="lg-input lg-text" type="email" dir="ltr" autoComplete="email" maxLength={120} value={f.email} onChange={set('email')} /></label>
            {msg && <p className={msg.ok ? 'st-hint' : 'lg-err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
            <button type="submit" className="tp-btn primary" disabled={busy}>{busy ? 'در حال ذخیره…' : complete ? 'ذخیرهٔ تغییرات' : 'ذخیره و تکمیل'}</button>
            <div className="lg-row">
              <button type="button" className="tp-btn" disabled={busy} onClick={async () => { setBusy(true); await logout(); setBusy(false) }}>خروج از حساب</button>
              <button type="button" className="tp-btn" disabled={busy} onClick={async () => { if (window.confirm('حساب شما حذف شود؟ این کار برگشت‌پذیر نیست.')) { setBusy(true); await deleteAccount(); setBusy(false) } }}>حذف حساب</button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
