import { useMemo, useState } from 'react'
import DestinationCard from '../../components/DestinationCard'
import DestinationContent from '../../components/DestinationContent'
import DestinationForm from '../components/DestinationForm'
import Modal from '../components/Modal'
import { fileToDataUrl } from '../imageFile'
import { api, ApiError, diffContent, friendly, NEXT, STATUS_LABEL, TRANSITION_LABEL, type Detail, type SImage, type Status } from '../suggestions/api'
import { ErrorBox, fmtDate, useLoad } from '../suggestions/shared'
import { faNum } from '../../lib/jalali'
import { Link } from '../../lib/router'
import { contentToDestination, destinationToContent } from '../../travel/suggestionContent'
import { SEASONS } from '../../travel/season'
import type { Season } from '../../data/destinations'

const IMG_LABEL = { candidate: 'نامزد', approved: 'تأییدشده', rejected: 'ردشده' }

export default function SuggestionDetail({ id }: { id: number }) {
  const { data, error, loading, reload } = useLoad(() => api<Detail>(`/admin/suggestions/${id}`), [id])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false), [rejecting, setRejecting] = useState(false), [reason, setReason] = useState('')
  const [preview, setPreview] = useState<'off' | 'mobile' | 'desktop'>('off')
  const [pair, setPair] = useState<[number, number] | null>(null)
  const [imgQuery, setImgQuery] = useState('')
  const [manual, setManual] = useState({ url: '', license: '', author: '', source_url: '' })

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ ok: true, text: ok }); reload() } catch (e) { setMsg({ ok: false, text: friendly(e) }); if (e instanceof ApiError && e.code === 'version_conflict') reload() }
    setBusy(false)
  }
  /** جست‌وجوی تصویر: با عبارت دستی (اگر نوشته شده) یا خودکار از روی مقصد؛ نتیجه نامزد می‌شود و تأیید دست مدیر است. */
  const searchImages = async () => {
    if (!s) return
    setBusy(true); setMsg(null)
    try {
      const q = imgQuery.trim(), r = await api<{ added: number; errors: string[] }>(`/admin/suggestions/${s.id}/images/search`, { method: 'POST', body: q ? { query: q } : {}, timeoutMs: 60_000 })
      setMsg({ ok: !r.errors.length, text: r.added || r.errors.length ? `${faNum(r.added)} تصویر نامزد افزوده شد.${r.errors.length ? ' ' + r.errors.join(' | ') : ''}` : 'تصویر جدیدی پیدا نشد؛ عبارت دیگری (ترجیحاً انگلیسی) امتحان کنید.' }); reload()
    } catch (e) { setMsg({ ok: false, text: friendly(e) }) }
    setBusy(false)
  }
  const s = data?.suggestion
  const cover = data?.images.find((i) => i.id === s?.cover_image_id)
  const dest = useMemo(() => (s ? contentToDestination(s.content, 0, cover?.url ?? '', cover?.attribution ?? undefined) : null), [s, cover])
  const vs = data?.versions ?? []
  const [va, vb] = pair ?? [vs[1]?.version ?? 0, vs[0]?.version ?? 0]
  const diff = useMemo(() => { const a = vs.find((v) => v.version === va), b = vs.find((v) => v.version === vb); return a && b ? diffContent(a.content, b.content) : [] }, [vs, va, vb])

  if (error) return <><Link to="/admin/suggestions" className="adm-btn">بازگشت</Link><ErrorBox error={error} onRetry={reload} /></>
  if (!data || !s || !dest) return <p className="adm-note" role="status">{loading ? 'در حال بارگذاری…' : ''}</p>

  const transition = (to: Status, reasonText?: string) => act(() => api(`/admin/suggestions/${s.id}/transition`, { method: 'POST', body: { to, reason: reasonText } }), `وضعیت: ${STATUS_LABEL[to]}`)
  const decide = (img: SImage, status: SImage['status']) => act(() => api(`/admin/images/${img.id}/decision`, { method: 'POST', body: { status } }), `تصویر ${IMG_LABEL[status]}`)

  return (
    <>
      <div className="adm-page-head"><div>
        <h2>{s.name} <span className={`adm-badge ${s.status === 'published' ? 'pub' : s.status === 'rejected' ? 'bad' : ''}`}>{STATUS_LABEL[s.status]}</span></h2>
        <p className="adm-note">نسخهٔ {faNum(s.version)} · {s.source === 'ai' ? 'تولید با هوش مصنوعی' : s.source === 'import' ? 'ورود JSON' : 'دستی'} · آخرین تغییر {fmtDate(s.updated_at)}</p></div>
        <Link to="/admin/suggestions" className="adm-btn">بازگشت به فهرست</Link></div>

      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{msg.text}</p>}
      {s.reject_reason && s.status === 'rejected' && <div className="adm-card adm-callout err"><strong>دلیل رد</strong><p className="adm-note">{s.reject_reason}</p></div>}
      {data.duplicates.length > 0 && <div className="adm-card adm-callout warn" role="note"><strong>احتمال تکراری</strong><p className="adm-note">پیشنهاد دیگری با همین نام و کشور وجود دارد: {data.duplicates.map((d) => <Link key={d.id} to={`/admin/suggestions/${d.id}`}>#{faNum(d.id)} ({STATUS_LABEL[d.status]}) </Link>)}</p></div>}
      {(data.publish_check.blocking.length > 0 || data.publish_check.warnings.length > 0) && s.status !== 'archived' && (
        <div className="adm-card adm-callout warn"><strong>شرایط انتشار</strong><ul className="adm-note">{data.publish_check.blocking.map((m) => <li key={m}>⛔ {m}</li>)}{data.publish_check.warnings.map((m) => <li key={m}>⚠ {m}</li>)}</ul></div>)}

      <section className="adm-card"><div className="adm-inline">
        {NEXT[s.status].map((to) => <button key={to} type="button" className={`adm-btn${to === 'published' || to === 'approved' ? ' primary' : ''}`} disabled={busy || (to === 'published' && data.publish_check.blocking.length > 0)} onClick={() => (to === 'rejected' ? setRejecting(true) : transition(to))}>{s.status === 'published' && to === 'approved' ? 'لغو انتشار' : TRANSITION_LABEL[to]}</button>)}
        {s.status !== 'archived' && <button type="button" className="adm-btn" disabled={busy} onClick={() => setEditing(true)}>ویرایش متن و داده‌ها</button>}
        <button type="button" className="adm-btn" onClick={() => setPreview(preview === 'off' ? 'mobile' : 'off')}>{preview === 'off' ? 'پیش‌نمایش' : 'بستن پیش‌نمایش'}</button>
        {['draft', 'rejected', 'archived'].includes(s.status) && <button type="button" className="adm-btn danger" disabled={busy} onClick={() => { if (window.confirm('این پیشنهاد و نسخه‌ها و تصاویرش برای همیشه حذف شود؟')) act(async () => { await api(`/admin/suggestions/${s.id}`, { method: 'DELETE' }); location.assign('/admin/suggestions') }, 'حذف شد') }}>حذف</button>}
      </div>{s.status === 'published' && <p className="adm-note">ویرایش متن، انتشار را لغو می‌کند تا نسخهٔ تازه دوباره دستی تأیید شود.</p>}</section>

      {preview !== 'off' && (
        <section className="adm-card"><div className="adm-inline"><strong>پیش‌نمایش</strong>
          <button type="button" className={`adm-btn sm${preview === 'mobile' ? ' primary' : ''}`} onClick={() => setPreview('mobile')}>موبایل</button>
          <button type="button" className={`adm-btn sm${preview === 'desktop' ? ' primary' : ''}`} onClick={() => setPreview('desktop')}>دسکتاپ</button></div>
          {!cover && <p className="adm-note">تصویر تأییدشده‌ای نیست؛ در پیش‌نمایش بدون تصویر نمایش داده می‌شود.</p>}
          <div className={`adm-frame ${preview}`}><div className="tp-page" data-theme="light" dir="rtl"><div className="tp-main">
            <div className="dest-grid"><DestinationCard destination={dest} onOpen={() => undefined} /></div>
            <DestinationContent destination={dest} season={dest.best_seasons[0] ?? 'بهار'} /></div></div></div></section>)}

      <div className="adm-grid2">
        <section className="adm-card"><h3 className="adm-sub">محتوا</h3>
          <dl className="adm-kv"><dt>کشور / شهر</dt><dd>{s.content.country} · {s.content.province_or_city}</dd><dt>نوع</dt><dd>{s.content.type.join('، ')}</dd><dt>مدت / بودجه</dt><dd>{s.content.duration} · {s.content.budget}</dd><dt>جاذبه‌ها</dt><dd>{s.content.attractions.join('، ') || '—'}</dd><dt>مختصات</dt><dd>{s.content.latitude !== undefined ? `${s.content.latitude}, ${s.content.longitude}` : '—'}</dd><dt>توضیح</dt><dd>{s.content.description}</dd></dl>
          <table className="adm-diff"><thead><tr><th>فصل</th><th>تناسب</th><th>دما</th><th>توضیح</th></tr></thead><tbody>{SEASONS.map((x) => { const c = s.content.seasons[x.id]; return <tr key={x.id}><td>{x.title}</td><td>{c.rating}</td><td>{faNum(c.temperature_min)}–{faNum(c.temperature_max)}</td><td>{c.description}</td></tr> })}</tbody></table></section>
        <section className="adm-card"><h3 className="adm-sub">منشأ و منابع</h3>
          {s.ai_meta ? <>
            <dl className="adm-kv"><dt>مدل</dt><dd>{s.ai_meta.model}{s.ai_meta.used_fallback ? ' (مدل جایگزین)' : ''}</dd><dt>نسخهٔ پرامپت</dt><dd>{s.ai_meta.prompt_version ? faNum(s.ai_meta.prompt_version) : 'پیش‌فرض داخلی'}</dd><dt>زمان تولید</dt><dd>{s.ai_meta.generated_at ? fmtDate(s.ai_meta.generated_at) : '—'}</dd></dl>
            {s.ai_meta.warnings?.map((w) => <p key={w} className="adm-note">⚠ {w}</p>)}
            {s.ai_meta.sources.length ? <ul>{s.ai_meta.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a></li>)}</ul> : <p className="adm-note">منبع وبی ثبت نشده؛ صحت متن را دستی بررسی کنید.</p>}
          </> : <p className="adm-note">وارد‌شده دستی؛ منبع خودکاری ندارد.</p>}</section>
      </div>

      <section className="adm-card"><div className="adm-page-head" style={{ margin: 0 }}><h3 className="adm-sub">تصاویر ({faNum(data.images.length)})</h3></div>
        <form className="adm-inline" style={{ marginTop: 8, flexWrap: 'wrap' }} role="search" onSubmit={(e) => { e.preventDefault(); void searchImages() }}>
          <input style={{ flex: '1 1 220px' }} dir="auto" maxLength={120} placeholder="عبارت جست‌وجو (مثلاً Yazd Jameh Mosque یا بازار یزد)" aria-label="عبارت جست‌وجوی تصویر" value={imgQuery} onChange={(e) => setImgQuery(e.target.value)} />
          <button type="submit" className="adm-btn primary" disabled={busy}>{imgQuery.trim() ? 'جست‌وجو' : 'جست‌وجوی خودکار'}</button>
        </form>
        <p className="adm-note">عبارت انگلیسی نتیجهٔ بهتری می‌دهد. اگر خالی بگذارید، با چند زاویه (جاذبه، معماری، بازار، طبیعت) خودکار جست‌وجو می‌شود. نتایج «نامزد» می‌شوند؛ هر کدام را که خواستید «تأیید» کنید.</p>
        <p className="adm-note">هیچ تصویری خودکار منتشر نمی‌شود؛ فقط تصویر «تأییدشده» می‌تواند تصویر اصلی باشد. منبع و مجوز هر تصویر را بررسی کنید.</p>
        {data.images.length === 0 ? <p className="adm-note">تصویری نیست. جست‌وجو کنید یا دستی اضافه کنید.</p> : (
          <div className="adm-img-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>{data.images.map((img) => (
            <div key={img.id} className={`adm-simg ${img.status}`}>
              <img src={img.thumb_url ?? img.url} alt="" loading="lazy" />
              <div className="adm-sg-meta"><span className={`adm-badge ${img.status === 'approved' ? 'on' : img.status === 'rejected' ? 'bad' : ''}`}>{IMG_LABEL[img.status]}</span>{img.id === s.cover_image_id && <span className="adm-badge pub">تصویر اصلی</span>}</div>
              <span className="adm-note">{img.attribution ?? img.author ?? 'بدون نام'} · {img.license ?? 'بدون مجوز'} · {img.provider}</span>
              {img.source_url && <a className="adm-note" href={img.source_url} target="_blank" rel="noopener noreferrer">منبع</a>}
              <div className="adm-simg-actions">
                {img.status !== 'approved' && <button className="adm-btn sm primary" disabled={busy} onClick={() => decide(img, 'approved')}>تأیید</button>}
                {img.status !== 'rejected' && <button className="adm-btn sm" disabled={busy} onClick={() => decide(img, 'rejected')}>رد</button>}
                {img.status === 'approved' && img.id !== s.cover_image_id && <button className="adm-btn sm" disabled={busy} onClick={() => act(() => api(`/admin/suggestions/${s.id}/cover`, { method: 'POST', body: { image_id: img.id } }), 'تصویر اصلی تغییر کرد')}>تصویر اصلی</button>}
                <button className="adm-btn sm danger" disabled={busy} onClick={() => act(() => api(`/admin/images/${img.id}`, { method: 'DELETE' }), 'حذف شد')}>حذف</button>
              </div></div>))}</div>)}
        <details style={{ marginTop: 10 }}><summary>افزودن تصویر دستی (آدرس یا فایل)</summary>
          <div className="adm-form" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <input dir="ltr" placeholder="https://… (آدرس تصویر)" aria-label="آدرس تصویر" value={manual.url.startsWith('data:') ? '(فایل انتخاب شد)' : manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} />
            <input type="file" accept="image/*" aria-label="فایل تصویر" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setManual({ ...manual, url: await fileToDataUrl(f) }) } catch (x) { setMsg({ ok: false, text: (x as Error).message }) } }} />
            <input placeholder="مجوز / منبع (الزامی؛ مثلاً «عکس خودم» یا CC BY 4.0)" aria-label="مجوز" value={manual.license} onChange={(e) => setManual({ ...manual, license: e.target.value })} />
            <input placeholder="نام عکاس" aria-label="عکاس" value={manual.author} onChange={(e) => setManual({ ...manual, author: e.target.value })} />
            <input dir="ltr" placeholder="https://… (صفحهٔ منبع، اختیاری)" aria-label="صفحهٔ منبع" value={manual.source_url} onChange={(e) => setManual({ ...manual, source_url: e.target.value })} />
            <div><button type="button" className="adm-btn primary" disabled={busy || !manual.url || !manual.license.trim()} onClick={() => act(async () => { await api(`/admin/suggestions/${s.id}/images`, { method: 'POST', body: { url: manual.url, license: manual.license, author: manual.author || undefined, source_url: manual.source_url || undefined, attribution: manual.author || undefined } }); setManual({ url: '', license: '', author: '', source_url: '' }) }, 'تصویر به‌عنوان نامزد افزوده شد')}>افزودن</button></div>
          </div></details></section>

      <section className="adm-card"><h3 className="adm-sub">نسخه‌ها ({faNum(vs.length)})</h3>
        <ul className="adm-note" style={{ paddingInlineStart: 18 }}>{vs.map((v) => <li key={v.id}>نسخهٔ {faNum(v.version)} — {v.note} — {fmtDate(v.created_at)}{v.version !== s.version && s.status !== 'archived' && <> <button className="adm-btn sm" disabled={busy} onClick={() => { if (window.confirm(`محتوای نسخهٔ ${v.version} به‌عنوان نسخهٔ تازه بازگردانده شود؟`)) act(() => api(`/admin/suggestions/${s.id}`, { method: 'PATCH', body: { content: v.content, expected_version: s.version, note: `بازگردانی نسخهٔ ${v.version}` } }), 'بازگردانی شد') }}>بازگردانی</button></>}</li>)}</ul>
        {vs.length > 1 && <>
          <div className="adm-inline"><label>از نسخه <select value={va} onChange={(e) => setPair([Number(e.target.value), vb])}>{vs.map((v) => <option key={v.id} value={v.version}>{faNum(v.version)}</option>)}</select></label>
            <label>به نسخه <select value={vb} onChange={(e) => setPair([va, Number(e.target.value)])}>{vs.map((v) => <option key={v.id} value={v.version}>{faNum(v.version)}</option>)}</select></label></div>
          {diff.length === 0 ? <p className="adm-note">تفاوتی نیست.</p> : <table className="adm-diff"><thead><tr><th>فیلد</th><th>قبل</th><th>بعد</th></tr></thead><tbody>{diff.map((d) => <tr key={d.path}><td dir="ltr">{d.path}</td><td className="before">{d.before || '—'}</td><td className="after">{d.after || '—'}</td></tr>)}</tbody></table>}</>}
      </section>

      {editing && <DestinationForm keepEmptyImage initial={dest} nextId={0} onClose={() => setEditing(false)} onSave={(d) => { setEditing(false); act(() => api(`/admin/suggestions/${s.id}`, { method: 'PATCH', body: { content: destinationToContent(d, s.content.image_query), expected_version: s.version, note: 'ویرایش دستی' } }), 'ذخیره شد (نسخهٔ تازه)') }} />}
      {rejecting && <Modal title="دلیل رد" onClose={() => setRejecting(false)}>
        <textarea rows={4} aria-label="دلیل رد" value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%' }} />
        <div className="adm-form-actions"><button className="adm-btn danger" disabled={!reason.trim()} onClick={() => { setRejecting(false); transition('rejected', reason.trim()); setReason('') }}>رد کردن</button><button className="adm-btn" onClick={() => setRejecting(false)}>انصراف</button></div></Modal>}
    </>
  )
}
