import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { FEED_TITLE, type FeedKind } from '../../feed/topics'
import { faNum } from '../../lib/jalali'
import { Link } from '../../lib/router'
import { api, friendly } from '../suggestions/api'
import { ErrorBox, fmtDate, ModeBanner, useLoad } from '../suggestions/shared'
import {
  FEED_STATUS_LABEL, FEED_TABS, factsToText, sourcesToText, textToFacts, textToSources,
  type AdminFeedItem, type FeedGenResponse, type FeedStatus, type TopicSummary,
} from '../feed/types'

const NOTE: Record<FeedKind, string> = {
  dyk: 'کاشی «آیا می‌دانستید» بین تاریخ و تقویم ماهانه (صفحهٔ اول). نکتهٔ جذاب دربارهٔ سفر، مقصدها و نکات مقصد؛ با لمس، پاپ‌آپ بزرگ با تصویر، متن کامل و منابع باز می‌شود.',
  mood: 'جملهٔ متناسب با فصل و حال‌وهوای روز برای بالای تقویم هفتگی؛ در پاپ‌آپ دکمهٔ «کشف سفر».',
  monthly: 'مقصدهای جذاب‌تر ماه جاری؛ بهترین زمان بازدید، هزینهٔ تقریبی و مدت سفر در «ویژگی‌ها».',
  personal: 'پیشنهادهای شخصی‌نما (مثل «۳ مقصد اقتصادی برای سفر دونفره»). این بخش فعلاً محتوای تولیدشده/دستی است؛ یادگیری از رفتار هر کاربر هنوز ساخته نشده.',
  week: 'پیشنهاد سفر این هفته (یک‌روزه، آخر هفته، اقتصادی، خانوادگی) با مدت، هزینه، مسیر و جاذبه‌های اطراف؛ دکمهٔ «برنامه سفرم رو بچین».',
  calendar: 'فرصت‌های سفری مرتبط با تعطیلات، مناسبت‌های محلی، شکوفه/پاییزگردی و جشنواره‌ها. تاریخ‌ها باید از منبع تأیید شوند.',
  mini: 'ایده‌های سفر کوچک: مقصد نزدیک برای یک روز، یک شب کمپ، روستای ناشناخته، سفر کم‌هزینه.',
  wishlist: 'ایده‌های «باید ببینم» برای لیست آرزوهای سفر.',
  discovery: 'هر روز یک مقصد، مسیر یا جاذبهٔ کمترشناخته‌شده.',
}

type Mut = (fn: () => Promise<unknown>, ok: string) => Promise<void>

export default function FeedAdmin({ kind }: { kind: FeedKind }) {
  const list = useLoad(() => api<{ items: AdminFeedItem[] }>(`/admin/feed/items?kind=${kind}`), [kind])
  const topics = useLoad(() => api<{ topics: TopicSummary[] }>('/admin/feed/topics'), [kind])
  const [tab, setTab] = useState<FeedStatus>('draft')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null), [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<AdminFeedItem | 'new' | null>(null)
  const [rejecting, setRejecting] = useState<AdminFeedItem | null>(null), [reason, setReason] = useState('')
  const [hint, setHint] = useState(''), [count, setCount] = useState(3), [gen, setGen] = useState<FeedGenResponse | null>(null)

  const reloadAll = () => { list.reload(); topics.reload() }
  const act: Mut = async (fn, ok) => {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ ok: true, text: ok }); reloadAll() } catch (e) { setMsg({ ok: false, text: friendly(e) }) }
    setBusy(false)
  }
  const transition = (it: AdminFeedItem, to: FeedStatus, text: string, why?: string) => act(() => api(`/admin/feed/items/${it.id}/transition`, { method: 'POST', body: { to, reason: why } }), text)

  const generate = async () => {
    setBusy(true); setMsg(null); setGen(null)
    try { setGen(await api<FeedGenResponse>('/admin/feed/generate', { method: 'POST', body: { kind, count, hint: hint.trim() || undefined }, timeoutMs: 300_000 })); setTab('draft'); reloadAll() } catch (e) { setMsg({ ok: false, text: friendly(e) }) }
    setBusy(false)
  }

  const items = list.data?.items ?? []
  const counts = useMemo(() => Object.fromEntries(FEED_TABS.map((s) => [s, items.filter((i) => i.status === s).length])) as Record<FeedStatus, number>, [items])
  const shown = items.filter((i) => i.status === tab)
  const summary = topics.data?.topics.find((t) => t.kind === kind)
  const queueLen = counts.queued

  return (
    <>
      <div className="adm-page-head"><div><h2>{FEED_TITLE[kind]}</h2><p className="adm-note">{NOTE[kind]}</p></div>
        <div className="adm-inline"><button type="button" className="adm-btn primary" onClick={() => setEditing('new')}>کارت جدید (دستی)</button><Link to="/admin/api-settings" className="adm-btn">تنظیمات API</Link></div></div>
      <ModeBanner />

      <section className="adm-card adm-feed-status">
        <p><strong>امروز در اپ:</strong> {summary?.today ? <>«{summary.today.title}»</> : <span className="adm-note">هنوز چیزی منتشر نشده — کارت تأییدشده وارد صف شود تا خودکار منتشر شود.</span>}</p>
        <p className="adm-note">هر روز (به وقت تهران) یک کارت از «صف انتشار» به‌ترتیب ورود منتشر می‌شود. در صف {faNum(queueLen)} کارت هست{queueLen ? ` (حدود ${faNum(queueLen)} روز محتوا)` : ''}؛ وقتی صف خالی شود آخرین کارت منتشرشده باقی می‌ماند.</p>
      </section>

      <section className="adm-card adm-form">
        <h3 className="adm-sub">تولید با هوش مصنوعی</h3>
        <p className="adm-note">مدل از جست‌وجوی وب (فارسی برای سایت‌های داخلی و انگلیسی برای سایت‌های خارجی) متن می‌سازد و برای هر کارت یک تصویر مرتبط پیدا و انتخاب می‌کند. نتیجه «پیش‌نویس» است؛ بعد از بررسی خودتان تأیید می‌کنید تا وارد صف شود.</p>
        <div className="adm-form-row">
          <label>موضوع یا مقصد دلخواه (اختیاری)<input value={hint} maxLength={120} onChange={(e) => setHint(e.target.value)} placeholder="مثلاً: شمال ایران، ترکیه، کویر" /></label>
          <label>تعداد کارت<select value={count} onChange={(e) => setCount(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{faNum(n)}</option>)}</select></label>
        </div>
        <div className="adm-form-actions"><button type="button" className="adm-btn primary" disabled={busy} onClick={generate}>{busy && !gen ? 'در حال تولید… (ممکن است چند دقیقه طول بکشد)' : 'تولید'}</button></div>
        {gen && <ul className="adm-note" style={{ paddingInlineStart: 18 }}>
          {gen.results.map((r, i) => <li key={i}><strong>{r.title}</strong>: {r.ok ? <span className="adm-result-ok">پیش‌نویس ساخته شد ({faNum(r.images_added ?? 0)} تصویر نامزد)</span> : <span className="adm-result-bad">رد شد: {r.reason}</span>}{r.image_errors?.map((m) => <div key={m}>تصویر: {m}</div>)}</li>)}
          {gen.meta.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
        </ul>}
      </section>

      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'adm-result-ok' : 'adm-result-bad'}>{msg.text}</p>}
      <div className="adm-tabs" role="tablist" aria-label="وضعیت">
        {FEED_TABS.map((s) => <button key={s} role="tab" aria-selected={tab === s} className={`adm-btn sm${tab === s ? ' primary' : ''}`} onClick={() => setTab(s)}>{FEED_STATUS_LABEL[s]} ({faNum(counts[s])})</button>)}
      </div>
      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {list.loading && !list.data && <p className="adm-note" role="status">در حال بارگذاری…</p>}
      {list.data && (shown.length === 0 ? <div className="adm-card adm-empty"><strong>کارتی در «{FEED_STATUS_LABEL[tab]}» نیست</strong></div> : (
        <ul className="adm-sg-list">{shown.map((it) => <FeedCard key={it.id} it={it} busy={busy} onEdit={() => setEditing(it)}
          onQueue={() => transition(it, 'queued', 'به صف انتشار رفت.')} onDraft={() => transition(it, 'draft', 'به پیش‌نویس برگشت.')}
          onPublish={() => transition(it, 'published', 'همین حالا منتشر شد.')} onReject={() => { setReason(''); setRejecting(it) }}
          onDelete={() => { if (window.confirm('این کارت برای همیشه حذف شود؟')) void act(() => api(`/admin/feed/items/${it.id}`, { method: 'DELETE' }), 'حذف شد.') }} />)}</ul>))}

      {editing && <ItemEditor kind={kind} initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onChanged={reloadAll} />}
      {rejecting && (
        <Modal title="رد کردن کارت" onClose={() => setRejecting(null)}>
          <form className="adm-form" onSubmit={(e) => { e.preventDefault(); const it = rejecting; setRejecting(null); void transition(it, 'rejected', 'رد شد.', reason) }}>
            <label>دلیل رد<textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus /></label>
            <div className="adm-form-actions"><button type="button" className="adm-btn" onClick={() => setRejecting(null)}>انصراف</button><button className="adm-btn danger solid" disabled={!reason.trim()}>رد</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

function FeedCard({ it, busy, onEdit, onQueue, onDraft, onPublish, onReject, onDelete }: { it: AdminFeedItem; busy: boolean; onEdit: () => void; onQueue: () => void; onDraft: () => void; onPublish: () => void; onReject: () => void; onDelete: () => void }) {
  const cover = it.images.find((i) => i.id === it.cover_image_id)
  const blocked = it.blocking.length > 0
  return (
    <li className="adm-card adm-feed-item">
      {cover ? <img className="adm-feed-img" src={cover.thumb_url ?? cover.url} alt="" loading="lazy" /> : <div className="adm-feed-img none" aria-hidden="true">بدون تصویر</div>}
      <div className="adm-feed-main">
        <div className="adm-sg-meta"><strong>{it.content.title}</strong>
          <span className={`adm-badge ${it.status === 'published' ? 'pub' : it.status === 'queued' ? 'on' : it.status === 'rejected' ? 'bad' : ''}`}>{FEED_STATUS_LABEL[it.status]}</span>
          <span className="adm-badge">{it.source === 'ai' ? 'هوش مصنوعی' : 'دستی'}</span>
          {it.queue_position && <span className="adm-badge on">نوبت {faNum(it.queue_position)}{it.queue_position === 1 ? ' (اولین انتشار)' : ''}</span>}
          {cover && it.cover_auto && <span className="adm-badge warn">تصویر را هوش مصنوعی انتخاب کرده</span>}
        </div>
        <p className="adm-feed-body">{it.content.body}</p>
        <span className="adm-note">{faNum(it.sources.length)} منبع · {faNum(it.images.length)} تصویر نامزد · {it.published_date ? `منتشر: ${it.published_date}` : `تغییر: ${fmtDate(it.updated_at)}`}</span>
        {it.reject_reason && <span className="adm-note">دلیل رد: {it.reject_reason}</span>}
        {it.ai_meta?.warnings.map((w) => <span key={w} className="adm-note">⚠ {w}</span>)}
        {it.status !== 'published' && it.blocking.map((b) => <span key={b} className="adm-note">⛔ {b}</span>)}
        <div className="adm-inline">
          {(it.status === 'draft' || it.status === 'rejected') && <button type="button" className="adm-btn sm" disabled={busy} onClick={onEdit}>ویرایش، تصویر و منابع</button>}
          {it.status === 'draft' && <button type="button" className="adm-btn sm primary" disabled={busy || blocked} onClick={onQueue}>تأیید و ورود به صف</button>}
          {it.status === 'draft' && <button type="button" className="adm-btn sm" disabled={busy} onClick={onReject}>رد</button>}
          {it.status === 'queued' && <button type="button" className="adm-btn sm primary" disabled={busy} onClick={onPublish}>انتشار همین حالا</button>}
          {(it.status === 'queued' || it.status === 'rejected') && <button type="button" className="adm-btn sm" disabled={busy} onClick={onDraft}>{it.status === 'queued' ? 'خروج از صف (پیش‌نویس)' : 'بازگشت به پیش‌نویس'}</button>}
          {it.status === 'published' && <button type="button" className="adm-btn sm" disabled={busy} onClick={onDraft}>لغو انتشار</button>}
          {(it.status === 'draft' || it.status === 'rejected') && <button type="button" className="adm-btn sm danger" disabled={busy} onClick={onDelete}>حذف</button>}
        </div>
      </div>
    </li>
  )
}

function ItemEditor({ kind, initial, onClose, onChanged }: { kind: FeedKind; initial: AdminFeedItem | null; onClose: () => void; onChanged: () => void }) {
  const [cur, setCur] = useState<AdminFeedItem | null>(initial)
  const [title, setTitle] = useState(initial?.content.title ?? ''), [body, setBody] = useState(initial?.content.body ?? ''), [place, setPlace] = useState(initial?.content.place ?? '')
  const [facts, setFacts] = useState(factsToText(initial?.content.facts ?? [])), [queries, setQueries] = useState((initial?.content.image_queries ?? []).join('\n'))
  const [sources, setSources] = useState(sourcesToText(initial?.sources ?? []))
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)
  const [q, setQ] = useState(''), [manual, setManual] = useState({ url: '', license: '', author: '' })

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); setInfo(''); try { await fn() } catch (e) { setErr(friendly(e)) } setBusy(false) }
  const content = () => ({ title: title.trim(), body: body.trim(), ...(place.trim() ? { place: place.trim() } : {}), facts: textToFacts(facts), image_queries: queries.split('\n').map((x) => x.trim()).filter(Boolean) })
  const save = () => run(async () => {
    if (cur) { const r = await api<{ item: AdminFeedItem }>(`/admin/feed/items/${cur.id}`, { method: 'PATCH', body: { content: content(), sources: textToSources(sources) } }); setCur(r.item); setInfo('ذخیره شد.'); onChanged() }
    else { const r = await api<{ item: AdminFeedItem }>('/admin/feed/items', { method: 'POST', body: { kind, content: content(), sources: textToSources(sources) } }); setCur(r.item); setInfo('کارت ساخته شد؛ حالا می‌توانید تصویر اضافه کنید.'); onChanged() }
  })
  const imgOp = (fn: () => Promise<{ item: AdminFeedItem; added?: number; errors?: string[] }>, ok: string) => run(async () => { const r = await fn(); setCur(r.item); setInfo(r.errors?.length ? `${ok} ${r.errors.join(' | ')}` : ok); onChanged() })

  return (
    <Modal title={cur ? `ویرایش: ${FEED_TITLE[kind]}` : `کارت جدید: ${FEED_TITLE[kind]}`} onClose={onClose} wide>
      <div className="adm-form">
        <label>عنوان<input value={title} maxLength={90} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>متن کامل (ابتدای آن روی کاشی دیده می‌شود)<textarea rows={6} value={body} maxLength={1200} onChange={(e) => setBody(e.target.value)} /></label>
        <div className="adm-form-row">
          <label>مکان (اختیاری)<input value={place} maxLength={80} onChange={(e) => setPlace(e.target.value)} /></label>
        </div>
        <label>ویژگی‌ها (هر خط «برچسب: مقدار»، مثل «هزینهٔ تقریبی: ۲ تا ۳ میلیون»)<textarea rows={3} value={facts} onChange={(e) => setFacts(e.target.value)} /></label>
        <label>منابع (هر خط «عنوان | https://…»؛ در پایین پاپ‌آپ برای کاربر نمایش داده می‌شود)<textarea rows={3} dir="ltr" value={sources} onChange={(e) => setSources(e.target.value)} /></label>
        <label>عبارت‌های جست‌وجوی تصویر (هر خط یکی، ترجیحاً انگلیسی)<textarea rows={2} dir="ltr" value={queries} onChange={(e) => setQueries(e.target.value)} /></label>
        <div className="adm-form-actions"><button type="button" className="adm-btn" onClick={onClose}>بستن</button><button type="button" className="adm-btn primary" disabled={busy || !title.trim() || !body.trim()} onClick={save}>ذخیره</button></div>
      </div>
      {err && <p role="alert" className="adm-result-bad">{err}</p>}{info && <p role="status" className="adm-result-ok">{info}</p>}

      {cur && (
        <section className="adm-feed-images">
          <h3 className="adm-sub">تصویر</h3>
          <p className="adm-note">تصویر اصلی همان است که در کاشی و پاپ‌آپ نمایش داده می‌شود. فقط تصویر دارای مجوز قابل انتخاب است.</p>
          <div className="adm-feed-grid">
            {cur.images.map((im) => (
              <figure key={im.id} className={`adm-feed-thumb${im.id === cur.cover_image_id ? ' cover' : ''}`}>
                <img src={im.thumb_url ?? im.url} alt="" loading="lazy" />
                <figcaption className="adm-note">{im.attribution ?? im.license ?? '—'}</figcaption>
                <div className="adm-inline">
                  <button type="button" className={`adm-btn sm${im.id === cur.cover_image_id ? ' primary' : ''}`} disabled={busy || im.id === cur.cover_image_id} onClick={() => imgOp(() => api(`/admin/feed/items/${cur.id}/cover`, { method: 'POST', body: { image_id: im.id } }), 'تصویر اصلی عوض شد.')}>{im.id === cur.cover_image_id ? 'تصویر اصلی' : 'انتخاب'}</button>
                  <button type="button" className="adm-btn sm danger" disabled={busy} onClick={() => imgOp(() => api(`/admin/feed/items/${cur.id}/images/${im.id}`, { method: 'DELETE' }), 'تصویر حذف شد.')}>حذف</button>
                </div>
              </figure>
            ))}
          </div>
          <div className="adm-inline">
            <input dir="ltr" aria-label="عبارت جست‌وجوی تصویر" placeholder="عبارت جست‌وجو (خالی = از روی عبارت‌های بالا)" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="adm-btn" disabled={busy} onClick={() => imgOp(() => api(`/admin/feed/items/${cur.id}/images/search`, { method: 'POST', body: q.trim() ? { query: q.trim() } : {}, timeoutMs: 60_000 }), 'جست‌وجوی تصویر انجام شد.')}>جست‌وجوی تصویر</button>
          </div>
          <div className="adm-inline">
            <input dir="ltr" aria-label="آدرس تصویر" placeholder="https://… آدرس تصویر" value={manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} />
            <input aria-label="مجوز تصویر" placeholder="مجوز (مثلاً «عکس خودم»)" value={manual.license} onChange={(e) => setManual({ ...manual, license: e.target.value })} />
            <input aria-label="عکاس" placeholder="عکاس (اختیاری)" value={manual.author} onChange={(e) => setManual({ ...manual, author: e.target.value })} />
            <button type="button" className="adm-btn" disabled={busy || !manual.url.trim() || !manual.license.trim()} onClick={() => imgOp(async () => { const r = await api<{ item: AdminFeedItem }>(`/admin/feed/items/${cur.id}/images`, { method: 'POST', body: { url: manual.url.trim(), license: manual.license.trim(), author: manual.author.trim() || null, attribution: [manual.author.trim(), manual.license.trim()].filter(Boolean).join(' — ') } }); setManual({ url: '', license: '', author: '' }); return r }, 'تصویر افزوده شد.')}>افزودن دستی</button>
          </div>
        </section>
      )}
    </Modal>
  )
}
