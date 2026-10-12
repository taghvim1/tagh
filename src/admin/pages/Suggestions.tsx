import { useEffect, useState } from 'react'
import { api, STATUS_LABEL, STATUS_ORDER, type Status, type Suggestion } from '../suggestions/api'
import { ErrorBox, fmtDate, ModeBanner, useLoad } from '../suggestions/shared'
import DestinationForm from '../components/DestinationForm'
import { faNum } from '../../lib/jalali'
import { Link, navigate } from '../../lib/router'
import { destinationToContent } from '../../travel/suggestionContent'
import { friendly } from '../suggestions/api'

interface ListResp { items: Suggestion[]; total: number; counts: Record<string, number> }
const BADGE: Partial<Record<Status, string>> = { published: 'pub', approved: 'on', pending_review: 'warn', rejected: 'bad' }
const SOURCE = { ai: 'هوش مصنوعی', manual: 'دستی', import: 'ورود JSON' }

// فهرست پیشنهادهای سفر با وضعیت، جست‌وجو، فیلتر و مرتب‌سازی؛ داده از API واقعی می‌آید
export default function Suggestions() {
  const [status, setStatus] = useState<Status | ''>('')
  const [q, setQ] = useState(''), [dq, setDq] = useState('')
  const [scope, setScope] = useState(''), [sort, setSort] = useState('updated')
  const [creating, setCreating] = useState(false), [msg, setMsg] = useState('')
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t) }, [q])

  const { data, error, loading, reload } = useLoad(() => {
    const p = new URLSearchParams({ sort, order: sort === 'name' ? 'asc' : 'desc', limit: '100' })
    if (status) p.set('status', status); if (dq.trim()) p.set('q', dq.trim()); if (scope) p.set('scope', scope)
    return api<ListResp>(`/admin/suggestions?${p}`)
  }, [status, dq, scope, sort])

  const create = async (d: Parameters<NonNullable<React.ComponentProps<typeof DestinationForm>['onSave']>>[0]) => {
    try { const r = await api<{ suggestion: Suggestion; duplicates: unknown[] }>('/admin/suggestions', { method: 'POST', body: { content: destinationToContent(d), source: 'manual' } }); navigate(`/admin/suggestions/${r.suggestion.id}`) }
    catch (e) { setMsg(friendly(e)) }
    setCreating(false)
  }

  return (
    <>
      <div className="adm-page-head"><div><h2>پیشنهادهای سفر</h2>
        <p className="adm-note">مدیریت چرخهٔ پیش‌نویس تا انتشار. فقط پیشنهاد «منتشرشده» با تصویر تأییدشده برای کاربر دیده می‌شود.</p></div>
        <div className="adm-inline"><button type="button" className="adm-btn primary" onClick={() => setCreating(true)}>پیشنهاد جدید</button><Link to="/admin/ai-suggestions" className="adm-btn">تولید با هوش مصنوعی</Link></div></div>
      <ModeBanner />
      {msg && <p role="alert" className="adm-note">{msg}</p>}
      <div className="adm-tabs" role="tablist" aria-label="وضعیت">
        {([['', 'همه'], ...STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]])] as [Status | '', string][]).map(([s, label]) => (
          <button key={s || 'all'} role="tab" aria-selected={status === s} className={`adm-btn sm${status === s ? ' primary' : ''}`} onClick={() => setStatus(s)}>{label} ({faNum(data?.counts[s || 'all'] ?? 0)})</button>
        ))}
      </div>
      <div className="adm-filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <input type="search" aria-label="جست‌وجو" placeholder="جست‌وجوی نام، کشور، استان…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="محدوده" value={scope} onChange={(e) => setScope(e.target.value)}><option value="">داخلی و خارجی</option><option value="domestic">داخلی</option><option value="international">خارجی</option></select>
        <select aria-label="مرتب‌سازی" value={sort} onChange={(e) => setSort(e.target.value)}><option value="updated">آخرین تغییر</option><option value="created">تاریخ ایجاد</option><option value="name">نام</option></select>
      </div>
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <p className="adm-note" role="status">در حال بارگذاری…</p>}
      {data && (data.items.length === 0 ? <div className="adm-card adm-empty"><strong>موردی نیست</strong><p className="adm-note">با «پیشنهاد جدید» یا «تولید با هوش مصنوعی» شروع کنید.</p></div> : (
        <ul className="adm-sg-list">{data.items.map((s) => (
          <li key={s.id}><button type="button" className="adm-card adm-sg-item" onClick={() => navigate(`/admin/suggestions/${s.id}`)}>
            <div className="adm-sg-meta"><strong>{s.name}</strong><span className={`adm-badge ${BADGE[s.status] ?? ''}`}>{STATUS_LABEL[s.status]}</span><span className="adm-badge">{SOURCE[s.source]}</span></div>
            <span className="adm-note">{s.country} · {s.content.province_or_city} · {s.content.type.join('، ')}</span>
            <span className="adm-note">تصویر: {faNum(s.image_counts?.approved ?? 0)} تأییدشده · {faNum(s.image_counts?.candidate ?? 0)} نامزد · نسخهٔ {faNum(s.version)} · {fmtDate(s.updated_at)}</span>
          </button></li>))}</ul>))}
      {creating && <DestinationForm keepEmptyImage nextId={0} onSave={create} onClose={() => setCreating(false)} />}
    </>
  )
}
