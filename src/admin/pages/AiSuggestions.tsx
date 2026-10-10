import { useMemo, useState } from 'react'
import { createRemoteAiGenerator, AiUnavailableError, type ImageResult } from '../ai/generator'
import { buildPrompt, checkApproval, draftRepo, parseAiDestinations, type AiDraftRecord } from '../ai/drafts'
import DestinationForm from '../components/DestinationForm'
import Modal from '../components/Modal'
import { faNum } from '../../lib/jalali'
import { nextId, useRepository } from '../../lib/localRepository'
import { destinationRepo, useDestinations } from '../../travel/repository'

const generator = createRemoteAiGenerator()
const STATUS: Record<AiDraftRecord['status'], string> = { draft: 'پیش‌نویس', approved: 'تأییدشده', rejected: 'ردشده' }
const errText = (e: unknown) => e instanceof AiUnavailableError ? (e.code === 'UNAUTHORIZED' ? 'دسترسی مدیر تأیید نشد.' : 'سرویس هوش مصنوعی در دسترس نیست؛ بک‌اند هنوز متصل نیست. از «چسباندن JSON» استفاده کنید.') : (e as Error).message

// تولید پیشنهاد سفر با هوش مصنوعی → پیش‌نویس → ویرایش (حتی تصویر) → تأیید دستی → انتشار در «پیشنهاد سفر»
export default function AiSuggestions() {
  const drafts = useRepository(draftRepo)
  const published = useDestinations()
  const [names, setNames] = useState('')
  const [json, setJson] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; lines: string[] } | null>(null)
  const [tab, setTab] = useState<AiDraftRecord['status'] | 'all'>('draft')
  const [edit, setEdit] = useState<AiDraftRecord | null>(null)
  const [imgFor, setImgFor] = useState<{ rec: AiDraftRecord; results: ImageResult[] | null; error: string } | null>(null)
  const [checks, setChecks] = useState<Record<number, string[]>>({})
  const list = names.split('\n').map((x) => x.trim()).filter(Boolean)
  const shown = useMemo(() => drafts.filter((d) => tab === 'all' || d.status === tab).sort((a, b) => b.id - a.id), [drafts, tab])

  const addParsed = (text: string, source: AiDraftRecord['source']) => {
    const base = nextId(draftRepo.getAll())
    const r = parseAiDestinations(text, base)
    const now = new Date().toISOString()
    draftRepo.setAll([...draftRepo.getAll(), ...r.items.map((it, i): AiDraftRecord => ({ id: base + i, status: 'draft', source, created_at: now, destination: it.destination, image_query: it.image_query }))])
    setMsg(r.errors.length ? { kind: 'err', lines: [r.items.length ? `${faNum(r.items.length)} مورد اضافه شد، اما:` : 'چیزی اضافه نشد:', ...r.errors] } : { kind: 'ok', lines: [`${faNum(r.items.length)} پیش‌نویس اضافه شد.`] })
    return r.items.length
  }
  const generate = async () => {
    setBusy(true); setMsg(null)
    try { addParsed(await generator.generate(list), 'api') } catch (e) { setMsg({ kind: 'err', lines: [errText(e)] }) } finally { setBusy(false) }
  }
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(buildPrompt(list)); setMsg({ kind: 'ok', lines: ['پرومپت کپی شد. آن را در هوش مصنوعی دلخواه اجرا کنید و خروجی JSON را در کادر پایین بچسبانید.'] }) }
    catch { setMsg({ kind: 'err', lines: ['کپی خودکار ممکن نشد؛ متن را از کادر «نمایش پرومپت» کپی کنید.'] }) }
  }
  const update = (rec: AiDraftRecord, patch: Partial<AiDraftRecord>) => draftRepo.upsert({ ...rec, ...patch })
  const searchImages = async (rec: AiDraftRecord) => {
    setImgFor({ rec, results: null, error: '' })
    try { setImgFor({ rec, results: await generator.searchImages(rec.image_query || rec.destination.name), error: '' }) } catch (e) { setImgFor({ rec, results: [], error: errText(e) }) }
  }
  const approve = (rec: AiDraftRecord) => {
    const c = checkApproval(rec.destination, published)
    if (c.blocking.length) { setChecks((x) => ({ ...x, [rec.id]: c.blocking })); return }
    const id = nextId(published)
    destinationRepo.upsert({ ...rec.destination, id, enabled: true })
    update(rec, { status: 'approved', publishedId: id }); setChecks((x) => ({ ...x, [rec.id]: [] }))
  }

  return (
    <>
      <div className="adm-page-head"><div><h2>پیشنهاد سفر با هوش مصنوعی</h2>
        <p className="adm-note">پیش‌نویس بساز، ویرایش و تصویر را بررسی کن، سپس دستی تأیید کن تا برای کاربران دیده شود.</p></div></div>

      <div className="adm-card" role="note" style={{ borderColor: '#e0b252', background: '#fff8e8', marginBottom: 12 }}>
        <strong>اتصال مستقیم به API هنوز آماده نیست</strong>
        <p className="adm-note">تولید خودکار و جست‌وجوی تصویر به سرور امن با کلید API نیاز دارد که هنوز ساخته نشده (کلید نباید در مرورگر باشد). تا آن موقع: پرومپت را کپی کن، در هوش مصنوعی اجرا کن و JSON را بچسبان؛ تصویر را هم از دستگاه یا با آدرس اضافه کن. پیش‌نویس‌ها فقط در همین مرورگر ذخیره می‌شوند.</p>
      </div>

      <section className="adm-card adm-form">
        <h3 className="adm-sub">۱) مقصدها</h3>
        <label>نام مقصدها (هر خط یکی)<textarea rows={4} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'سنندج\nکیش\nاستانبول'} /></label>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn primary" disabled={!list.length || busy} onClick={generate}>{busy ? 'در حال ارسال…' : 'تولید با API'}</button>
          <button type="button" className="adm-btn" disabled={!list.length} onClick={copyPrompt}>کپی پرومپت</button>
        </div>
        <details><summary>نمایش پرومپت و قالب JSON</summary><pre className="adm-pre" dir="rtl">{buildPrompt(list)}</pre></details>
        <h3 className="adm-sub">۲) چسباندن خروجی JSON</h3>
        <textarea rows={6} dir="ltr" aria-label="خروجی JSON" value={json} onChange={(e) => setJson(e.target.value)} placeholder='[ { "name": "...", ... } ]' />
        <div className="adm-form-actions"><button type="button" className="adm-btn primary" disabled={!json.trim()} onClick={() => { if (addParsed(json, 'import')) setJson('') }}>افزودن به پیش‌نویس‌ها</button></div>
        {msg && <ul className={msg.kind === 'err' ? 'adm-error-list' : 'adm-note'} role={msg.kind === 'err' ? 'alert' : 'status'}>{msg.lines.map((l) => <li key={l}>{l}</li>)}</ul>}
      </section>

      <h3 className="adm-sub">پیش‌نویس‌ها</h3>
      <div className="adm-filters" role="tablist" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {(['draft', 'approved', 'rejected', 'all'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`adm-btn${tab === t ? ' primary' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? 'همه' : STATUS[t]} ({faNum(t === 'all' ? drafts.length : drafts.filter((d) => d.status === t).length)})
          </button>
        ))}
      </div>
      {shown.length === 0 ? <div className="adm-card adm-empty"><strong>موردی نیست</strong></div> : (
        <ul className="adm-draft-list">
          {shown.map((rec) => {
            const d = rec.destination
            const c = checkApproval(d, published.filter((p) => p.id !== rec.publishedId))
            return (
              <li key={rec.id} className="adm-card">
                <div className="adm-event-head"><strong>{d.name}</strong><span className={`adm-badge ${rec.status === 'approved' ? 'on' : 'off'}`}>{STATUS[rec.status]}</span></div>
                <div className="adm-img-row">
                  {d.image ? <img src={d.image} alt="" className="adm-thumb" /> : <span className="adm-note">بدون تصویر</span>}
                </div>
                <p className="adm-note">{d.country} · {d.province_or_city} · {d.type.join('، ')} · بهترین فصل: {d.best_seasons.join('، ') || '—'}</p>
                {rec.status === 'draft' && [...c.warnings, ...(checks[rec.id] ?? c.blocking)].length > 0 && (
                  <ul className="adm-note">{(checks[rec.id] ?? c.blocking).map((m) => <li key={m}>⛔ {m}</li>)}{c.warnings.map((m) => <li key={m}>⚠ {m}</li>)}</ul>)}
                <div className="adm-row-actions" style={{ flexWrap: 'wrap' }}>
                  {rec.status !== 'approved' && <button className="adm-btn" onClick={() => setEdit(rec)}>ویرایش</button>}
                  {rec.status !== 'approved' && <button className="adm-btn" onClick={() => searchImages(rec)}>جست‌وجوی تصویر</button>}
                  {rec.status === 'draft' && <button className="adm-btn primary" onClick={() => approve(rec)}>تأیید و انتشار</button>}
                  {rec.status === 'draft' && <button className="adm-btn" onClick={() => update(rec, { status: 'rejected' })}>رد</button>}
                  {rec.status === 'rejected' && <button className="adm-btn" onClick={() => update(rec, { status: 'draft' })}>بازگردانی</button>}
                  {rec.status === 'approved' && <span className="adm-note">منتشر شد؛ ویرایش از بخش «مقصدها».</span>}
                  <button className="adm-btn danger" onClick={() => draftRepo.remove(rec.id)}>حذف</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {edit && <DestinationForm key={edit.id} keepEmptyImage initial={edit.destination} nextId={edit.id} onSave={(dest) => { update(edit, { destination: dest }); setEdit(null) }} onClose={() => setEdit(null)} />}
      {imgFor && (
        <Modal title={`تصویر «${imgFor.rec.destination.name}»`} onClose={() => setImgFor(null)} wide>
          {imgFor.results === null && <p className="adm-note">در حال جست‌وجو…</p>}
          {imgFor.error && <p role="alert" className="adm-note">{imgFor.error}</p>}
          {imgFor.results && imgFor.results.length > 0 && (
            <div className="adm-img-grid">{imgFor.results.map((r) => (
              <button key={r.url} type="button" className="adm-img-pick" onClick={() => { update(imgFor.rec, { destination: { ...imgFor.rec.destination, image: r.url } }); setImgFor(null) }}>
                <img src={r.thumb ?? r.url} alt="" />{r.credit && <span className="adm-note">{r.credit}</span>}
              </button>))}</div>)}
          <div className="adm-form-actions"><button className="adm-btn" onClick={() => setImgFor(null)}>بستن</button></div>
        </Modal>
      )}
    </>
  )
}
