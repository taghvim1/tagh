import { useRef, useState } from 'react'
import AppChrome from '../components/AppChrome'
import { requestPackage, BUDGETS, TRIP_TYPES, VEHICLES } from '../package/client'
import CloudToast from '../package/CloudToast'
import PackageView from '../package/PackageView'
import { isPackageSaved, removePackage, savePackage, useSavedPackages } from '../package/saved'
import type { PackageInput, TourPackage } from '../package/types'
import { toLatinDigits } from '../auth/phone'
import { faNum } from '../lib/jalali'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// «پکیج تور»: کاربر مشخصات سفر را می‌دهد؛ سرور با هوش مصنوعی (پرامپت قابل‌ویرایش در پنل مدیریت) برنامه می‌سازد.
export default function PackagePage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const [f, setF] = useState({ origin: '', destination: '', budget: BUDGETS[1], amount: '', vehicle: VEHICLES[0], trip_type: TRIP_TYPES[0], days: 3 })
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [pkg, setPkg] = useState<TourPackage | null>(null)
  const [toast, setToast] = useState(false)
  const saved = useSavedPackages()
  const isSaved = !!pkg && saved.some((p) => p.id === pkg.id)
  const resultRef = useRef<HTMLDivElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (f.origin.trim().length < 2 || f.destination.trim().length < 2) { setErr('شهر مبدأ و مقصد را وارد کنید.'); return }
    const amount = Number(toLatinDigits(f.amount).replace(/\D/g, ''))
    const input: PackageInput = { origin: f.origin.trim(), destination: f.destination.trim(), budget: f.budget, vehicle: f.vehicle, trip_type: f.trip_type, days: f.days, ...(amount >= 100_000 ? { amount_toman: amount } : {}) }
    setBusy(true); setErr(null); setPkg(null)
    const r = await requestPackage(input)
    setBusy(false)
    if (!r.ok) { setErr(r.message); return }
    setPkg(r.package); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const toggleSave = () => {
    if (!pkg) return
    if (isPackageSaved(pkg.id)) { removePackage(pkg.id); return }
    savePackage(pkg); setToast(true)
  }
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setErr(null) }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head"><h1>پکیج تور</h1><p className="tp-lead">مشخصات سفرت را بگو تا برنامهٔ کامل و نکات مقصد را برایت طراحی کنیم.</p></header>

        <form className="lg-card pk-form" onSubmit={submit} noValidate>
          <label className="lg-field">شهر مبدأ<input className="lg-input lg-text" maxLength={60} value={f.origin} onChange={(e) => set('origin', e.target.value)} placeholder="مثلاً تهران" /></label>
          <label className="lg-field">شهر مقصد<input className="lg-input lg-text" maxLength={60} value={f.destination} onChange={(e) => set('destination', e.target.value)} placeholder="مثلاً شیراز" /></label>
          <label className="lg-field">بودجه
            <select className="lg-input lg-text" value={f.budget} onChange={(e) => set('budget', e.target.value)}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select>
          </label>
          <label className="lg-field">مبلغ تقریبی برای هر نفر، به تومان (اختیاری)
            <input className="lg-input lg-text" inputMode="numeric" dir="ltr" maxLength={14} value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="مثلاً 15000000" />
          </label>
          <label className="lg-field">وسیلهٔ نقلیه
            <select className="lg-input lg-text" value={f.vehicle} onChange={(e) => set('vehicle', e.target.value)}>{VEHICLES.map((b) => <option key={b}>{b}</option>)}</select>
          </label>
          <label className="lg-field">نوع سفر
            <select className="lg-input lg-text" value={f.trip_type} onChange={(e) => set('trip_type', e.target.value)}>{TRIP_TYPES.map((b) => <option key={b}>{b}</option>)}</select>
          </label>
          <div className="lg-field">تعداد روز
            <div className="pk-stepper">
              <button type="button" className="tp-btn" aria-label="کمتر" disabled={f.days <= 1} onClick={() => set('days', f.days - 1)}>−</button>
              <output aria-live="polite">{faNum(f.days)} روز</output>
              <button type="button" className="tp-btn" aria-label="بیشتر" disabled={f.days >= 30} onClick={() => set('days', f.days + 1)}>+</button>
            </div>
          </div>
          {err && <p className="lg-err" role="alert">{err}</p>}
          <button type="submit" className="tp-btn primary" disabled={busy}>{busy ? 'در حال طراحی پکیج… (حدود ۲۰ ثانیه)' : 'طراحی پکیج'}</button>
        </form>

        {pkg && (
          <div ref={resultRef} className="pk-result">
            <PackageView pkg={pkg} actions={
              <div className="pk-actions">
                <button type="button" className={`pk-fav${isSaved ? ' on' : ''}`} aria-pressed={isSaved} onClick={toggleSave}>
                  <span aria-hidden="true">{isSaved ? '♥' : '♡'}</span> {isSaved ? 'در علاقه‌مندی‌ها ذخیره شد' : 'برای ذخیره، دکمهٔ علاقه‌مندی را بزنید'}
                </button>
              </div>
            } />
          </div>
        )}
      </main>
      <CloudToast open={toast} onClose={() => setToast(false)} text="پکیج در علاقه‌مندی‌ها ذخیره شد" linkTo="/favorites" linkText="مشاهده" />
    </div>
  )
}
