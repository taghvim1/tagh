import { useEffect, useState } from 'react'
import { api, friendly } from '../suggestions/api'
import { ErrorBox, ModeBanner, useLoad } from '../suggestions/shared'
import { BUDGETS, TRIP_TYPES, VEHICLES } from '../../package/client'
import PackageView from '../../package/PackageView'
import type { TourPackage } from '../../package/types'

interface Info { enabled: boolean; prompt: string; default_prompt: string; placeholders: string[] }
type Msg = { ok: boolean; text: string } | null
const HELP: Record<string, string> = {
  '{{origin}}': 'شهر مبدأ', '{{destination}}': 'شهر مقصد', '{{budget}}': 'سطح بودجه', '{{amount}}': 'مبلغ اختیاری (در صورت وارد‌کردن کاربر)',
  '{{vehicle}}': 'وسیلهٔ نقلیه', '{{trip_type}}': 'نوع سفر', '{{days}}': 'تعداد روز', '{{schema}}': 'قالب JSON خروجی (الزامی)', '{{sources}}': 'منابع جست‌وجوی وب (اگر فعال باشد)',
}

// پرامپت طراحی «پکیج تور». مدل، کلیدها و جست‌وجوی وب در «تنظیمات API» تنظیم می‌شوند و برای همین قابلیت هم به کار می‌روند.
export default function PackagePrompt() {
  const info = useLoad(() => api<Info>('/admin/package'), [])
  const [prompt, setPrompt] = useState(''), [enabled, setEnabled] = useState(true)
  const [busy, setBusy] = useState<string | null>(null), [msg, setMsg] = useState<Msg>(null)
  const [t, setT] = useState({ origin: 'تهران', destination: 'شیراز', budget: BUDGETS[1], vehicle: VEHICLES[0], trip_type: TRIP_TYPES[0], days: 3 })
  const [preview, setPreview] = useState<TourPackage | null>(null)
  useEffect(() => { if (info.data) { setPrompt(info.data.prompt); setEnabled(info.data.enabled) } }, [info.data])
  const d = info.data
  const dirty = !!d && (prompt !== d.prompt || enabled !== d.enabled)

  const run = async (id: string, fn: () => Promise<string>) => {
    setBusy(id); setMsg(null)
    try { setMsg({ ok: true, text: await fn() }) } catch (e) { setMsg({ ok: false, text: friendly(e) }) }
    setBusy(null); info.reload()
  }

  return (
    <>
      <div className="adm-page-head"><div><h2>پکیج تور (پرامپت هوش مصنوعی)</h2><p className="adm-note">متن زیر برای طراحی پکیج در صفحهٔ «پکیج تور» برنامه به مدل داده می‌شود. مدل، کلید Gemini و جست‌وجوی وب (Tavily) و جست‌وجوی تصویر از «تنظیمات API» می‌آید. تصویر مقصد از میان نتایج دارای مجوز به‌صورت تصادفی انتخاب می‌شود.</p></div></div>
      <ModeBanner />
      {info.error ? <ErrorBox error={info.error} onRetry={info.reload} /> : !d ? <p className="adm-note">در حال بارگذاری…</p> : <>
        <section className="adm-card">
          <h3 className="adm-sub">پرامپت</h3>
          <div className="adm-form" style={{ display: 'grid', gap: 10 }}>
            <label className="adm-switch-row"><span>طراحی پکیج برای کاربران روشن باشد</span><input type="checkbox" role="switch" className="adm-switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /></label>
            <textarea aria-label="متن پرامپت" rows={22} value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={12000} style={{ lineHeight: 1.9 }} />
            <details><summary>جاگذارها (جایگزین خودکار)</summary>
              <ul className="adm-note">{d.placeholders.map((p) => <li key={p}><code dir="ltr">{p}</code> — {HELP[p]}</li>)}</ul>
              <p className="adm-note">حتماً <code dir="ltr">{'{{origin}} {{destination}} {{days}} {{schema}}'}</code> را نگه دارید؛ بدون <code dir="ltr">{'{{schema}}'}</code> خروجی مدل قابل‌خواندن نیست. یک قاعدهٔ ثابتِ «فقط JSON فارسی» همیشه به انتها اضافه می‌شود.</p>
            </details>
            <div className="adm-inline">
              <button type="button" className="adm-btn primary" disabled={busy !== null || !dirty} onClick={() => void run('save', async () => { await api('/admin/package', { method: 'PUT', body: { enabled, prompt } }); return 'ذخیره شد.' })}>ذخیره</button>
              <button type="button" className="adm-btn" disabled={busy !== null || prompt === d.default_prompt} onClick={() => { if (window.confirm('متن پرامپت به حالت پیش‌فرض برگردد؟')) void run('reset', async () => { await api('/admin/package/reset', { method: 'POST' }); return 'به پیش‌فرض برگشت.' }) }}>بازنشانی به پیش‌فرض</button>
              {dirty && <span className="adm-note">تغییرات ذخیره‌نشده</span>}
            </div>
            {msg && <p role="status" className={msg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{msg.text}</p>}
          </div>
        </section>

        <section className="adm-card">
          <h3 className="adm-sub">آزمایش با ورودی نمونه</h3>
          <p className="adm-note">با پرامپتِ ذخیره‌شده یک پکیج واقعی می‌سازد (یک فراخوانی AI؛ هزینه دارد). ابتدا تغییرات را ذخیره کنید.</p>
          <form className="adm-form" style={{ display: 'grid', gap: 8 }} onSubmit={(e) => { e.preventDefault(); setPreview(null); void run('test', async () => { const r = await api<{ package: TourPackage }>('/admin/package/test', { method: 'POST', body: t, timeoutMs: 90_000 }); setPreview(r.package); return 'پکیج ساخته شد.' }) }}>
            <input aria-label="مبدأ" value={t.origin} onChange={(e) => setT({ ...t, origin: e.target.value })} placeholder="مبدأ" />
            <input aria-label="مقصد" value={t.destination} onChange={(e) => setT({ ...t, destination: e.target.value })} placeholder="مقصد" />
            <select aria-label="بودجه" value={t.budget} onChange={(e) => setT({ ...t, budget: e.target.value })}>{BUDGETS.map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="وسیله" value={t.vehicle} onChange={(e) => setT({ ...t, vehicle: e.target.value })}>{VEHICLES.map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="نوع سفر" value={t.trip_type} onChange={(e) => setT({ ...t, trip_type: e.target.value })}>{TRIP_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
            <input aria-label="تعداد روز" type="number" min={1} max={30} value={t.days} onChange={(e) => setT({ ...t, days: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} />
            <button className="adm-btn primary" disabled={busy !== null || dirty}>{busy === 'test' ? 'در حال ساخت…' : 'ساخت پکیج آزمایشی'}</button>
          </form>
          {preview && <div className="adm-card" style={{ marginTop: 12 }}><div className="tp-page" data-theme="light" style={{ minHeight: 0, background: 'transparent' }}><PackageView pkg={preview} /></div></div>}
        </section>
      </>}
    </>
  )
}
