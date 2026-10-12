import { useState } from 'react'
import { api, friendly, type GenResult } from '../suggestions/api'
import { ModeBanner } from '../suggestions/shared'
import { draftRepo } from '../ai/drafts'
import { faNum } from '../../lib/jalali'
import { Link } from '../../lib/router'
import { useRepository } from '../../lib/localRepository'
import { destinationToContent } from '../../travel/suggestionContent'

// استودیوی تولید: نام مقصدها → API (Gemini + منبع وب + نامزد تصویر) → پیش‌نویس در سرور → بررسی و تأیید دستی در «پیشنهادهای سفر»
export default function AiSuggestions() {
  const [names, setNames] = useState(''), [busy, setBusy] = useState(false)
  const [results, setResults] = useState<GenResult[]>([]), [err, setErr] = useState('')
  const [json, setJson] = useState(''), [imp, setImp] = useState<string[]>([])
  const legacy = useRepository(draftRepo).filter((d) => d.status === 'draft')
  const list = [...new Set(names.split('\n').map((x) => x.trim()).filter(Boolean))]

  const generate = async () => {
    setBusy(true); setErr(''); setResults([])
    try { setResults((await api<{ results: GenResult[] }>('/admin/ai/generate', { method: 'POST', body: { names: list }, timeoutMs: 300_000 })).results) } catch (e) { setErr(friendly(e)) }
    setBusy(false)
  }
  const importJson = async () => {
    let data: unknown
    try { data = JSON.parse(json.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { setImp(['متن JSON معتبر نیست.']); return }
    const arr = Array.isArray(data) ? data : (data as { destinations?: unknown[] })?.destinations
    if (!Array.isArray(arr) || !arr.length) { setImp(['آرایهٔ مقصدها پیدا نشد.']); return }
    const out: string[] = []
    for (const [i, c] of arr.entries()) {
      try { const r = await api<{ suggestion: { id: number } }>('/admin/suggestions', { method: 'POST', body: { content: c, source: 'import' } }); out.push(`مورد ${faNum(i + 1)}: افزوده شد (#${faNum(r.suggestion.id)})`) } catch (e) { out.push(`مورد ${faNum(i + 1)}: ${friendly(e)}`) }
    }
    setImp(out)
  }
  const migrate = async () => {
    const out: string[] = []
    for (const d of legacy) {
      try { await api('/admin/suggestions', { method: 'POST', body: { content: destinationToContent(d.destination, d.image_query), source: 'import' } }); draftRepo.remove(d.id); out.push(`«${d.destination.name}» منتقل شد (تصویر قدیمی منتقل نمی‌شود؛ در سرور تصویر جدید با مجوز اضافه کنید).`) } catch (e) { out.push(`«${d.destination.name}»: ${friendly(e)}`) }
    }
    setImp(out)
  }

  return (
    <>
      <div className="adm-page-head"><div><h2>تولید پیشنهاد با هوش مصنوعی</h2>
        <p className="adm-note">نتیجه فقط «پیش‌نویس» است. متن را بررسی و ویرایش کن، تصویر را دستی تأیید کن و بعد منتشر کن.</p></div><Link to="/admin/api-settings" className="adm-btn">تنظیمات API</Link></div>
      <ModeBanner />
      <section className="adm-card adm-form">
        <h3 className="adm-sub">مقصدها (هر خط یکی، حداکثر ۵)</h3>
        <textarea rows={4} aria-label="نام مقصدها" value={names} onChange={(e) => setNames(e.target.value)} placeholder={'سنندج\nکیش\nاستانبول'} />
        <div className="adm-form-actions"><button type="button" className="adm-btn primary" disabled={!list.length || list.length > 5 || busy} onClick={generate}>{busy ? 'در حال تولید… (ممکن است چند دقیقه طول بکشد)' : 'تولید'}</button></div>
        {err && <p role="alert" className="adm-result-bad">{err}</p>}
        {results.length > 0 && <ul style={{ paddingInlineStart: 18 }}>{results.map((r) => (
          <li key={r.name}><strong>{r.name}</strong>: {r.ok ? <span className="adm-result-ok">پیش‌نویس ساخته شد — <Link to={`/admin/suggestions/${r.id}`}>بررسی و ویرایش</Link> ({faNum(r.images_added ?? 0)} نامزد تصویر{r.duplicates?.length ? '، ⚠ احتمال تکراری' : ''})</span> : <span className="adm-result-bad">ناموفق: {r.errors?.join(' | ')}</span>}
            {r.image_errors?.map((m) => <div key={m} className="adm-note">تصویر: {m}</div>)}{r.meta?.warnings?.map((m) => <div key={m} className="adm-note">⚠ {m}</div>)}</li>))}</ul>}
      </section>

      <section className="adm-card adm-form" style={{ marginTop: 12 }}>
        <h3 className="adm-sub">یا چسباندن خروجی JSON (بدون API)</h3>
        <p className="adm-note">آرایه‌ای از مقصدها با همان قالب؛ سرور هر مورد را اعتبارسنجی می‌کند و به‌صورت پیش‌نویس می‌افزاید.</p>
        <textarea rows={6} dir="ltr" aria-label="خروجی JSON" value={json} onChange={(e) => setJson(e.target.value)} placeholder='[ { "name": "...", ... } ]' />
        <div className="adm-form-actions"><button type="button" className="adm-btn primary" disabled={!json.trim()} onClick={importJson}>افزودن به پیش‌نویس‌ها</button>
          {legacy.length > 0 && <button type="button" className="adm-btn" onClick={migrate}>انتقال {faNum(legacy.length)} پیش‌نویس قدیمیِ این مرورگر به سرور</button>}</div>
        {imp.length > 0 && <ul className="adm-note">{imp.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      </section>
    </>
  )
}
