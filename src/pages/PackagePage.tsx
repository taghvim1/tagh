import { useEffect, useRef, useState } from 'react'
import AppChrome from '../components/AppChrome'
import CenterModal from '../components/CenterModal'
import { toLatinDigits } from '../auth/phone'
import { faNum } from '../lib/jalali'
import { useOverlay } from '../lib/overlay'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { BUDGETS, preparePush, startPackage, TRIP_TYPES, VEHICLES } from '../package/client'
import CloudToast from '../package/CloudToast'
import { addJob, markSeen, removeJob, useJobs } from '../package/jobs'
import PackageView from '../package/PackageView'
import { removePackage, savePackage, useSavedPackages } from '../package/saved'
import type { TourPackage } from '../package/types'

const ERR_FA: Record<string, string> = { not_configured: 'طراحی پکیج فعلاً در دسترس نیست.', disabled: 'طراحی پکیج فعلاً در دسترس نیست.', quota: 'ظرفیت سرویس پر است؛ کمی بعد دوباره امتحان کنید.', bad_output: 'طراحی این بار موفق نشد؛ دوباره امتحان کنید.', gone: 'این درخواست پیدا نشد.' }

// «پکیج تور»: فرم کوچک + جعبهٔ «پکیج‌های من» (بالا سمت چپ). طراحی روی سرور انجام می‌شود؛ نتیجه در جعبه می‌آید و اعلان می‌رسد.
export default function PackagePage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const [f, setF] = useState({ origin: '', destination: '', amount: '', budget: BUDGETS[1], vehicle: VEHICLES[0], trip_type: TRIP_TYPES[0], days: 3 })
  const [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [note, setNote] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const jobs = useJobs(), saved = useSavedPackages()
  const boxPop = useOverlay('package-box'), viewPop = useOverlay('package-view')
  const [shown, setShown] = useState<TourPackage | null>(null)
  const watching = useRef(new Set<string>()) // کارهایی که در همین صفحه شروع شده‌اند؛ با اتمام، نتیجه خودکار باز می‌شود

  const open = (p: TourPackage, jobId?: string) => { setShown(p); if (jobId) markSeen(jobId); viewPop.show() }
  useEffect(() => {
    for (const j of jobs) if (j.status === 'done' && j.package && watching.current.has(j.id)) { watching.current.delete(j.id); open(j.package, j.id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs])
  useEffect(() => { // باز شدن از اعلان: /package?job=...
    const id = new URLSearchParams(window.location.search).get('job'); if (!id) return
    const j = jobs.find((x) => x.id === id)
    if (j?.package) open(j.package, id); else boxPop.show()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSaved = !!shown && saved.some((p) => p.id === shown.id)
  const pending = jobs.filter((j) => j.status === 'pending').length
  const unseen = jobs.filter((j) => j.status === 'done' && !j.seen).length
  const count = saved.length + jobs.length

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (f.origin.trim().length < 2 || f.destination.trim().length < 2) { setErr('شهر مبدأ و مقصد را وارد کنید.'); return }
    const amount = Number(toLatinDigits(f.amount).replace(/\D/g, ''))
    if (f.amount && amount < 100_000) { setErr('مبلغ بودجه را به تومان و درست وارد کنید (مثلاً 15000000).'); return }
    setBusy(true); setErr(null); setNote(null)
    const push = await preparePush()
    const input = { origin: f.origin.trim(), destination: f.destination.trim(), budget: f.budget, vehicle: f.vehicle, trip_type: f.trip_type, days: f.days, ...(amount >= 100_000 ? { amount_toman: amount } : {}) }
    const r = await startPackage(input, push)
    setBusy(false)
    if (!r.ok) { setErr(r.message); return }
    addJob(r.jobId, input); watching.current.add(r.jobId)
    setToast('طراحی شروع شد؛ نتیجه در «پکیج‌های من» می‌آید')
    setNote(push ? 'می‌توانید از برنامه خارج شوید؛ وقتی آماده شد اعلان می‌آید.' : 'می‌توانید از این صفحه بروید؛ نتیجه در «پکیج‌های من» می‌ماند. برای دریافت اعلان، اجازهٔ اعلان را بدهید.')
  }
  const toggleSave = () => { if (!shown) return; if (isSaved) removePackage(shown.id); else { savePackage(shown); setToast('پکیج در علاقه‌مندی‌ها ذخیره شد') } }
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setErr(null) }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main pk-font">
        <div className="pk-top">
          <h1>پکیج تور</h1>
          <button type="button" className="pk-box-btn" onClick={() => boxPop.show()} aria-label={`پکیج‌های من، ${count} مورد`}>
            <span aria-hidden="true">🧳</span> پکیج‌های من
            {(pending > 0 || unseen > 0 || count > 0) && <i className={`pk-badge${unseen ? ' new' : ''}`}>{pending ? '…' : faNum(unseen || count)}</i>}
          </button>
        </div>

        <form className="pk-form" onSubmit={submit} noValidate>
          <div className="pk-row2">
            <label>مبدأ<input maxLength={60} value={f.origin} onChange={(e) => set('origin', e.target.value)} placeholder="تهران" /></label>
            <label>مقصد<input maxLength={60} value={f.destination} onChange={(e) => set('destination', e.target.value)} placeholder="شیراز" /></label>
          </div>
          <div className="pk-row2 pk-row-budget">
            <label>بودجه (تومان، هر نفر)<input inputMode="numeric" dir="ltr" maxLength={14} value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="15000000" /></label>
            <div className="pk-seg" role="radiogroup" aria-label="سطح بودجه">
              {BUDGETS.map((b) => <button key={b} type="button" role="radio" aria-checked={f.budget === b} className={f.budget === b ? 'on' : ''} onClick={() => set('budget', b)}>{b}</button>)}
            </div>
          </div>
          <div className="pk-row2">
            <label>وسیلهٔ نقلیه<select value={f.vehicle} onChange={(e) => set('vehicle', e.target.value)}>{VEHICLES.map((b) => <option key={b}>{b}</option>)}</select></label>
            <label>نوع سفر<select value={f.trip_type} onChange={(e) => set('trip_type', e.target.value)}>{TRIP_TYPES.map((b) => <option key={b}>{b}</option>)}</select></label>
          </div>
          <div className="pk-days-pick">
            <span>تعداد روز</span>
            <div className="pk-stepper">
              <button type="button" aria-label="کمتر" disabled={f.days <= 1} onClick={() => set('days', f.days - 1)}>−</button>
              <output aria-live="polite">{faNum(f.days)}</output>
              <button type="button" aria-label="بیشتر" disabled={f.days >= 30} onClick={() => set('days', f.days + 1)}>+</button>
            </div>
          </div>
          {err && <p className="lg-err" role="alert">{err}</p>}
          {note && <p className="st-hint" role="status">{note}</p>}
          <button type="submit" className="pk-go" disabled={busy}>{busy ? 'در حال ارسال…' : 'طراحی پکیج'}</button>
        </form>
      </main>

      {/* جعبهٔ «پکیج‌های من»: کارهای در جریان + ذخیره‌شده‌ها */}
      <CenterModal open={boxPop.open} onClose={boxPop.hide} label="پکیج‌های من" className="pk-font">
        <div className="pk-boxlist">
          <h2>پکیج‌های من</h2>
          {count === 0 && <p className="pk-small">هنوز پکیجی ندارید. فرم را پر کنید و «طراحی پکیج» را بزنید.</p>}
          {jobs.length > 0 && (
            <ul className="pk-saved">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button type="button" className="pk-saved-open" disabled={j.status !== 'done'} onClick={() => j.package && open(j.package, j.id)}>
                    <span className={`pk-st ${j.status}`} aria-hidden="true">{j.status === 'pending' ? '⏳' : j.status === 'done' ? '✓' : '!'}</span>
                    <span><strong>{j.input.origin} ← {j.input.destination}</strong><small>{j.status === 'pending' ? 'در حال طراحی… (می‌توانید بیرون بروید)' : j.status === 'done' ? (j.seen ? 'آماده' : 'آماده شد؛ برای دیدن بزنید') : ERR_FA[j.error ?? ''] ?? 'ناموفق'}</small></span>
                  </button>
                  {j.status !== 'pending' && <button type="button" className="pk-saved-del" aria-label="حذف" onClick={() => removeJob(j.id)}>×</button>}
                </li>
              ))}
            </ul>
          )}
          {saved.length > 0 && <h3>ذخیره‌شده‌ها</h3>}
          <ul className="pk-saved">
            {saved.map((p) => (
              <li key={p.id}>
                <button type="button" className="pk-saved-open" onClick={() => open(p)}>
                  <span className="pk-st done" aria-hidden="true">♥</span>
                  <span><strong>{p.content.title}</strong><small>{p.input.origin} ← {p.input.destination} · {faNum(p.input.days)} روز</small></span>
                </button>
                <button type="button" className="pk-saved-del" aria-label={`حذف ${p.content.title}`} onClick={() => { if (window.confirm('این پکیج حذف شود؟')) removePackage(p.id) }}>×</button>
              </li>
            ))}
          </ul>
        </div>
      </CenterModal>

      <CenterModal open={viewPop.open && !!shown} onClose={viewPop.hide} label={shown?.content.title ?? 'پکیج'}>
        {shown && (
          <PackageView pkg={shown} actions={
            <button type="button" className={`pk-fav${isSaved ? ' on' : ''}`} aria-pressed={isSaved} onClick={toggleSave}>
              <span aria-hidden="true">{isSaved ? '♥' : '♡'}</span> {isSaved ? 'ذخیره شد' : 'برای ذخیره، دکمهٔ علاقه‌مندی را بزنید'}
            </button>
          } />
        )}
      </CenterModal>
      <CloudToast open={!!toast} onClose={() => setToast(null)} text={toast ?? ''} linkTo={toast?.includes('ذخیره شد') ? '/favorites' : undefined} linkText="مشاهده" />
    </div>
  )
}
