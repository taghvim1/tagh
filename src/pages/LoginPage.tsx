import { useEffect, useRef, useState } from 'react'
import { tracker } from '../analytics'
import { refreshAuth, requestCode, useAuth, verifyCode, type RequestError, type VerifyError } from '../auth/client'
import { normalizeIranMobile, toLatinDigits } from '../auth/phone'
import { faNum } from '../lib/jalali'

const REQUEST_MSG: Record<RequestError, string> = {
  invalid_phone: 'شمارهٔ موبایل معتبر نیست؛ مثل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید.',
  too_soon: 'برای ارسال دوباره کمی صبر کنید.',
  too_many: 'تعداد درخواست‌ها زیاد بود؛ یک ساعت دیگر دوباره تلاش کنید.',
  sms_unavailable: 'ورود با پیامک فعلاً در دسترس نیست.',
  sms_failed: 'ارسال پیامک ناموفق بود؛ کمی بعد دوباره تلاش کنید.',
  forbidden: 'درخواست پذیرفته نشد؛ صفحه را دوباره باز کنید.',
  network: 'ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.',
}
const VERIFY_MSG: Record<VerifyError, string> = {
  invalid: 'کد را ۶ رقمی وارد کنید.',
  expired: 'کد منقضی یا مصرف شده است؛ کد تازه بگیرید.',
  wrong_code: 'کد نادرست است.',
  locked: 'تلاش‌های اشتباه زیاد بود؛ کد تازه بگیرید.',
  forbidden: 'درخواست پذیرفته نشد؛ صفحه را دوباره باز کنید.',
  network: 'ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.',
}

// ورود با شمارهٔ موبایل: ۱) شماره ← ۲) کد پیامکی ۶ رقمی. جلسه در کوکی امن سرور می‌ماند.
export const REQUEST_ERRORS = REQUEST_MSG
/** مراحل ورود/ثبت‌نام (بدون قاب صفحه)؛ در صفحهٔ «پروفایل» استفاده می‌شود. پس از موفقیت وضعیت ورود عوض می‌شود و صفحه خودش فرم پروفایل را نشان می‌دهد. */
export function LoginFlow() {
  const auth = useAuth()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phoneInput, setPhoneInput] = useState(''), [phone, setPhone] = useState('')
  const [code, setCode] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null)
  const [wait, setWait] = useState(0), [dev, setDev] = useState<string | null>(null)
  const submitting = useRef(false)
  useEffect(() => { void refreshAuth() }, [])
  useEffect(() => { if (wait <= 0) return; const t = window.setTimeout(() => setWait((w) => w - 1), 1000); return () => window.clearTimeout(t) }, [wait])

  const send = async (p: string) => {
    setBusy(true); setErr(null)
    const r = await requestCode(p)
    setBusy(false)
    if (!r.ok) { if (r.error === 'too_soon' && r.retryAfter) { setWait(r.retryAfter); if (step === 'phone') { setPhone(p); setStep('code') } } setErr(REQUEST_MSG[r.error]); return }
    setPhone(p); setStep('code'); setCode(''); setWait(r.resendIn); setDev(r.devCode ?? null)
  }
  const onPhone = (e: React.FormEvent) => {
    e.preventDefault()
    const p = normalizeIranMobile(phoneInput)
    if (!p) { setErr(REQUEST_MSG.invalid_phone); return }
    void send(p)
  }
  const verify = async (value: string) => {
    if (submitting.current) return
    submitting.current = true; setBusy(true); setErr(null)
    const anon = tracker.consent().analytics ? tracker.exportMyData().installation.anonymous_id : undefined // وصل‌کردن رویدادهای قبلی فقط با رضایت تحلیل
    const r = await verifyCode(phone, value, anon)
    submitting.current = false; setBusy(false)
    if (r.ok) return
    setErr(r.error === 'wrong_code' && r.attemptsLeft !== undefined ? `${VERIFY_MSG.wrong_code} ${faNum(r.attemptsLeft)} تلاش باقی مانده.` : VERIFY_MSG[r.error])
    if (r.error !== 'wrong_code') setCode('')
  }
  const onCode = (v: string) => {
    const d = toLatinDigits(v).replace(/\D/g, '').slice(0, 6)
    setCode(d)
    if (d.length === 6) void verify(d) // با کامل‌شدن ۶ رقم خودکار تأیید می‌شود
  }

  if (auth.available === false) return <p className="st-hint">{REQUEST_MSG.sms_unavailable}</p>
  return step === 'phone' ? (
    <form className="lg-card" onSubmit={onPhone} noValidate>
      <p className="st-hint">با شمارهٔ موبایل ثبت‌نام کنید یا وارد شوید؛ کد تأیید پیامک می‌شود.</p>
      <label className="lg-field">شمارهٔ موبایل
        <input className="lg-input" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="09123456789" value={phoneInput} onChange={(e) => { setPhoneInput(e.target.value); setErr(null) }} autoFocus aria-invalid={!!err} />
      </label>
      {err && <p className="lg-err" role="alert">{err}</p>}
      <button type="submit" className="tp-btn primary" disabled={busy || !phoneInput.trim()}>{busy ? 'در حال ارسال…' : 'ارسال کد'}</button>
    </form>
  ) : (
    <div className="lg-card">
      <p>کد ۶ رقمی به <strong dir="ltr">{phone.slice(0, 4)}***{phone.slice(-4)}</strong> پیامک شد.</p>
      <label className="lg-field">کد تأیید
        <input className="lg-input lg-code" type="text" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={12} placeholder="••••••" value={code} onChange={(e) => onCode(e.target.value)} autoFocus disabled={busy} aria-invalid={!!err} />
      </label>
      {dev && <p className="st-hint">محیط توسعه — کد: <strong dir="ltr">{dev}</strong></p>}
      {err && <p className="lg-err" role="alert">{err}</p>}
      <div className="lg-row">
        <button type="button" className="tp-btn primary" disabled={busy || code.length !== 6} onClick={() => void verify(code)}>{busy ? 'در حال بررسی…' : 'تأیید و ورود'}</button>
        <button type="button" className="tp-btn" disabled={busy || wait > 0} onClick={() => void send(phone)}>{wait > 0 ? `ارسال دوباره (${faNum(wait)})` : 'ارسال دوباره'}</button>
      </div>
      <button type="button" className="lg-link" onClick={() => { setStep('phone'); setCode(''); setErr(null); setWait(0) }}>ویرایش شماره</button>
    </div>
  )
}
