import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK_DESTINATIONS } from '../../data/destinations'
import { can, type AdminRole } from '../../analytics/admin/access'
import { ApiRequestError, ApiUnavailableError, createDemoApi, createRemoteApi, NotReadyError, type OfferResult, type PromoLog, type UsersApi } from '../../analytics/admin/api'
import { readInternalFlag, setInternalDevice } from '../../lib/internal'
import type { AudienceCounts, DashboardStats, ProfileFilters, SortKey } from '../../analytics/admin/query'
import { PRESETS } from '../../analytics/admin/query'
import type { Page, UserSummary } from '../../analytics/admin/profiles'
import { faNum } from '../../lib/jalali'
import UserDetailView, { fmtDate } from '../components/UserDetail'
import UserDetailReal from '../components/UserDetailReal'

type Tab = 'overview' | 'list' | 'audience'
const ROLES: Array<[AdminRole, string]> = [['super_admin', 'مدیر کل'], ['support', 'پشتیبان'], ['analyst', 'تحلیلگر'], ['marketing', 'بازاریابی']]
const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان']
const TYPES = ['جنگل', 'کویر', 'ساحل', 'کوهستان', 'تاریخی', 'فرهنگی', 'طبیعت']
const destName = (id: number) => MOCK_DESTINATIONS.find((d) => d.id === id)?.name ?? `مقصد ${faNum(id)}`
const msgOf = (e: unknown) => e instanceof ApiRequestError ? e.message : e instanceof ApiUnavailableError ? 'سرور در دسترس نیست (بک‌اند متصل نیست).' : e instanceof NotReadyError ? 'این قابلیت هنوز آماده نیست.' : (e as Error).message.startsWith('FORBIDDEN') ? 'نقش فعلی اجازهٔ این بخش را ندارد.' : 'خطای ناشناخته'

function FilterForm({ value, onChange }: { value: ProfileFilters; onChange: (f: ProfileFilters) => void }) {
  const set = (p: Partial<ProfileFilters>) => onChange({ ...value, ...p })
  const sel = (label: string, key: keyof ProfileFilters, opts: Array<[string, string]>) => (
    <select aria-label={label} value={String(value[key] ?? '')} onChange={(e) => set({ [key]: e.target.value || undefined } as Partial<ProfileFilters>)}>
      <option value="">{label}: همه</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
  return (
    <div className="adm-filters" role="search">
      <select aria-label="آماده" value="" onChange={(e) => { const p = PRESETS.find((x) => x.id === e.target.value); if (p) onChange({ ...p.filters }) }}>
        <option value="">فیلترهای آماده…</option>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <input type="search" placeholder="جست‌وجوی شناسه یا نام" aria-label="جست‌وجو" value={value.query ?? ''} onChange={(e) => set({ query: e.target.value || undefined })} />
      {sel('وضعیت', 'status', [['guest', 'مهمان'], ['registered', 'ثبت‌نام‌شده']])}
      {sel('فصل', 'season', SEASONS.map((s) => [s, s]))}
      {sel('نوع مقصد', 'destType', TYPES.map((s) => [s, s]))}
      {sel('بودجه', 'budget', ['اقتصادی', 'متوسط', 'راحت', 'لوکس'].map((s) => [s, s]))}
      {sel('داخلی/خارجی', 'scope', [['داخلی', 'داخلی'], ['خارجی', 'خارجی']])}
      {sel('شهر', 'city', ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'رشت', 'یزد', 'اهواز'].map((s) => [s, s]))}
      <select aria-label="آخرین فعالیت" value={value.lastActiveWithinDays ?? ''} onChange={(e) => set({ lastActiveWithinDays: e.target.value ? Number(e.target.value) : undefined })}>
        <option value="">آخرین فعالیت: همه</option><option value="1">۱ روز</option><option value="7">۷ روز</option><option value="30">۳۰ روز</option>
      </select>
      {sel('تعامل', 'engagement', [['low', 'کم (<۱۰ رویداد)'], ['medium', 'متوسط'], ['high', 'زیاد (≥۳۰)']])}
      {sel('رضایت تبلیغاتی', 'marketingConsent', [['true', 'دارد'], ['false', 'ندارد']])}
    </div>
  )
}
// مقدار بولین از select رشته می‌آید
const fixBool = (f: ProfileFilters): ProfileFilters => ({ ...f, marketingConsent: f.marketingConsent === undefined ? undefined : String(f.marketingConsent) === 'true' })

const consentBadge = (v?: boolean | null) => v === true ? <span className="adm-badge on">دارد</span> : v === false ? <span className="adm-badge off">ندارد</span> : <span className="adm-badge warn">نامشخص</span>

const DIM_FA: Record<string, string> = { type: 'نوع مقصد', season: 'فصل', budget: 'بودجه', style: 'سبک سفر', scope: 'داخلی/خارجی' }
/** مخاطب به چه چیزی علاقه دارد: تعداد کاربران با علاقهٔ قوی به هر مورد، به تفکیک نوع علاقه */
function InterestsCard({ interests, hasEvents }: { interests: Array<{ dimension: string; value: string; people: number }>; hasEvents: boolean }) {
  const max = Math.max(1, ...interests.map((i) => i.people))
  const dims = [...new Set(interests.map((i) => i.dimension))]
  return (
    <div className="adm-card" style={{ display: 'grid', gap: 8 }}>
      <h3>مخاطب به چه چیزی علاقه دارد؟</h3>
      {!interests.length ? (
        <p className="adm-note">{hasEvents ? 'هنوز علاقهٔ قوی‌ای شکل نگرفته؛ با دیدن و انتخاب مقصد/فصل/بودجه توسط کاربران پر می‌شود.' : 'هنوز رفتاری از کاربران نرسیده است. کاربر باید رضایت تحلیل داشته باشد (پیش‌فرض روشن) و برنامه را باز کند؛ وضعیت دریافت داده را در کارت بالا ببینید.'}</p>
      ) : dims.map((dim) => (
        <div key={dim}>
          <strong>{DIM_FA[dim] ?? dim}</strong>
          {interests.filter((i) => i.dimension === dim).map((i) => (
            <div key={i.value} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 48px', alignItems: 'center', gap: 8, margin: '3px 0' }}>
              <span>{i.value}</span>
              <div style={{ background: 'rgba(127,127,127,.18)', borderRadius: 6, height: 10 }}><div style={{ width: `${Math.max(6, (i.people / max) * 100)}%`, height: '100%', borderRadius: 6, background: 'var(--adm-accent, #2e7d6b)' }} /></div>
              <span>{faNum(i.people)} نفر</span>
            </div>
          ))}
        </div>
      ))}
      <p className="adm-note">تعداد کاربرانی که به هر مورد علاقهٔ قوی دارند. از رویدادهای ۱۸۰ روز اخیرِ کسانی که رضایت تحلیل داده‌اند محاسبه می‌شود.</p>
    </div>
  )
}

/** وضعیت دریافت داده: چرا ممکن است علایق خالی باشد */
function DataHealth({ stats }: { stats: DashboardStats }) {
  const d = stats.diagnostics!
  const warns: string[] = []
  if (d.events_total === 0) warns.push('هیچ رویدادی به سرور نرسیده است. برنامه را روی یک دستگاه عادی (نه دستگاه آزمایشی/localhost) باز کنید و مقصدی را ببینید.')
  if (d.unlinked_analytics_ids > 0) warns.push(`رویداد ${faNum(d.unlinked_analytics_ids)} شناسهٔ ردیاب هنوز به کاربری وصل نشده؛ با باز شدن دوبارهٔ برنامه توسط همان کاربر وصل می‌شود.`)
  if (d.guests_never_returned > 5 && d.guests_never_returned / Math.max(1, stats.total) > 0.5) warns.push(`${faNum(d.guests_never_returned)} مهمان فقط یک‌بار باز شده‌اند (احتمالاً ربات یا بازدید آزمایشی). از «پاک‌سازی مهمان‌های بی‌فعالیت» پایین استفاده کنید.`)
  return (
    <div className="adm-card" style={{ display: 'grid', gap: 6 }}>
      <h3>وضعیت دریافت داده</h3>
      <p className="adm-note">رویداد ثبت‌شده: <strong>{faNum(d.events_total)}</strong> (۲۴ ساعت اخیر: {faNum(d.events_24h)}) · کاربر دارای رویداد: <strong>{faNum(d.people_with_events)}</strong> از {faNum(stats.total)}</p>
      <p className="adm-note">رضایت تحلیل: {faNum(d.analytics_granted)} · رضایت تبلیغاتی: {faNum(d.marketing_granted)} · مجوز اعلان: {faNum(d.notifications_granted)} · مجوز موقعیت: {faNum(d.location_granted)} · اشتراک اعلان فعال: {faNum(d.push_subscribers)}</p>
      {warns.map((w) => <p key={w} className="adm-note" role="status">⚠ {w}</p>)}
    </div>
  )
}

export default function Users() {
  const demo = useMemo(() => createDemoApi(), [])
  const [mode, setMode] = useState<'demo' | 'remote'>('remote')
  const remote = useMemo(() => createRemoteApi(), [])
  const api: UsersApi = mode === 'demo' ? demo : remote
  const [role, setRole] = useState<AdminRole>('analyst')
  const actor = useMemo(() => ({ adminId: 'demo-admin', role }), [role])
  const [tab, setTab] = useState<Tab>('overview')
  const [filters, setFilters] = useState<ProfileFilters>({})
  const [sort, setSort] = useState<SortKey>('last_active_at')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [list, setList] = useState<Page<UserSummary> | null>(null)
  const [aud, setAud] = useState<AudienceCounts | null>(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [offer, setOffer] = useState({ title: '', body: '' })
  const [rev, setRev] = useState(0)
  const [url, setUrl] = useState('/')
  const [sending, setSending] = useState(false), [result, setResult] = useState<OfferResult | null>(null), [history, setHistory] = useState<PromoLog[]>([])
  const [staleDays, setStaleDays] = useState(3), [stale, setStale] = useState<number | null>(null), [cleaning, setCleaning] = useState(false), [notice, setNotice] = useState('')
  const [internal, setInternal] = useState(() => readInternalFlag() === '1')

  const fail = (e: unknown) => setErr(msgOf(e))
  useEffect(() => { setErr(''); setStats(null); api.stats(actor).then(setStats).catch(fail) }, [api, role, rev])
  useEffect(() => { if (tab === 'list') api.list(actor, { filters: fixBool(filters), sort, dir, page, pageSize: 10 }).then((p) => { setList(p); setErr('') }).catch((e) => { setList(null); fail(e) }) }, [api, role, tab, filters, sort, dir, page, rev])
  useEffect(() => { if (tab === 'audience') api.audience(actor, { ...fixBool(filters), marketingConsent: undefined }).then((a) => { setAud(a); setErr('') }).catch((e) => { setAud(null); fail(e) }) }, [api, role, tab, filters])
  useEffect(() => { if (mode === 'remote' && tab === 'overview') api.staleGuests(actor, staleDays).then((r) => setStale(r.count)).catch(() => setStale(null)) }, [api, mode, tab, staleDays, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mode === 'remote' && tab === 'audience') api.promoHistory(actor).then((r) => setHistory(r.items)).catch(() => setHistory([])) }, [api, mode, tab, result]) // eslint-disable-line react-hooks/exhaustive-deps
  const changeFilters = useCallback((f: ProfileFilters) => { setFilters(f); setPage(1) }, [])
  const send = async () => {
    const n = aud?.eligible ?? 0
    if (!window.confirm(`این پیشنهاد برای ${faNum(n)} نفر (واجد شرایط دریافت) ارسال می‌شود و قابل بازگشت نیست. ادامه می‌دهید؟`)) return
    setSending(true); setErr(''); setResult(null)
    try { setResult(await api.sendOffer(actor, { ...offer, kind: 'promotional', filters: { ...fixBool(filters), marketingConsent: undefined }, url })); setRev((x) => x + 1) } catch (e) { fail(e) } finally { setSending(false) }
  }
  const cleanup = async () => {
    if (!stale || !window.confirm(`${faNum(stale)} مهمانِ بی‌فعالیت (یک‌بار باز شده و ${faNum(staleDays)} روز برنگشته) همراه با رویدادهایشان پاک می‌شوند. ادامه می‌دهید؟`)) return
    setCleaning(true); setErr(''); setNotice('')
    try { const r = await api.cleanupGuests(actor, staleDays); setNotice(`${faNum(r.removed)} مهمان پاک شد (${faNum(r.deleted_events)} رویداد، ${faNum(r.deleted_consents)} رکورد رضایت).`); setRev((x) => x + 1) } catch (e) { fail(e) } finally { setCleaning(false) }
  }

  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1
  const th = (k: SortKey, label: string) => <th><button className="adm-btn" style={{ minHeight: 28, border: 0, background: 'none' }} onClick={() => { setDir(sort === k && dir === 'desc' ? 'asc' : 'desc'); setSort(k) }}>{label}{sort === k ? (dir === 'desc' ? ' ▼' : ' ▲') : ''}</button></th>

  return (
    <>
      <div className="adm-page-head"><div><h2>کاربران و تحلیل رفتار</h2></div></div>

      <div className="adm-card" role="note" style={{ borderColor: '#e0b252', background: '#fff8e8', marginBottom: 12 }}>
        <strong>{mode === 'demo' ? 'داده‌ی نمایشی — ساختگی' : 'داده‌ی واقعی سرور'}</strong>
        <p className="adm-note">
          {mode === 'demo' ? 'همهٔ کاربران این صفحه ساختگی‌اند و فقط برای نمایش رابط تولید می‌شوند. داده‌ی واقعی کاربران فقط از طریق API امن سرور قابل نمایش است و هنوز چنین سرویسی وجود ندارد. انتخاب نقش در این صفحه یک شبیه‌سازی است و امنیت واقعی ایجاد نمی‌کند؛ مجوزها باید در سرور اعمال شوند.' : 'هر نصب تازه به‌صورت «مهمان» ثبت می‌شود؛ با ثبت‌نام با شماره به «ثبت‌نام‌شده» و با تکمیل نام و شهر به «پروفایل کامل» تبدیل می‌شود. رفتار و علایق فقط از کاربرانی می‌آید که رضایت تحلیل داده‌اند. ربات‌ها، پنل مدیریت و دستگاه‌های آزمایشی ثبت نمی‌شوند. اگر سرور در دسترس نباشد، خطا نمایش داده می‌شود و داده ساختگی جایگزین نمی‌شود.'}
        </p>
        <div className="adm-filters two">
          {mode === 'demo' && <select aria-label="نقش نمایشی" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>{ROLES.map(([r, l]) => <option key={r} value={r}>نقش: {l}</option>)}</select>}
          <select aria-label="منبع داده" value={mode} onChange={(e) => { setMode(e.target.value as 'demo' | 'remote'); setList(null); setAud(null) }}><option value="remote">منبع: سرور (واقعی)</option><option value="demo">منبع: نمایشی</option></select>
        </div>
        {mode === 'remote' && (
          <label className="adm-inline" style={{ marginTop: 8, gap: 8 }}>
            <input type="checkbox" checked={internal} onChange={(e) => { setInternal(e.target.checked); setInternalDevice(e.target.checked) }} />
            <span>این دستگاه آزمایشی است (نصب و رفتارش ثبت نشود)<small className="adm-note" style={{ display: 'block' }}>مرورگری که پنل مدیریت را باز کند خودکار آزمایشی می‌شود. برای تست مسیر کامل کاربر عادی، این گزینه را بردارید.</small></span>
          </label>
        )}
      </div>

      <div className="adm-filters" role="tablist" style={{ gridTemplateColumns: 'repeat(3, 1fr)', margin: '8px 0' }}>
        {([['overview', 'نمای کلی'], ['list', 'فهرست'], ['audience', 'مخاطب هدفمند']] as Array<[Tab, string]>).map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`adm-btn${tab === t ? ' primary' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      {err && <div className="adm-card" role="alert"><strong>{err}</strong></div>}

      {tab === 'overview' && stats && (
        <>
          <div className="adm-stats">
            {([['کل پروفایل‌ها', stats.total], ['مهمان', stats.guests], ['ثبت‌نام‌شده', stats.registered], ...(mode === 'remote' ? [['پروفایل کامل', (stats as { complete?: number }).complete ?? 0], ['پروفایل ناقص', (stats as { incomplete?: number }).incomplete ?? 0]] as Array<[string, number]> : []), ['فعال روزانه', stats.dau], ['فعال هفتگی', stats.wau], ['فعال ماهانه', stats.mau], ['جدید (۳۰ روز)', stats.newProfiles], ['بازگشتی', stats.returning], ['نشست‌ها (۳۰ روز)', stats.sessions], ['علاقه‌مندی‌ها', stats.favorites], ['جست‌وجوها', stats.searches], ['کلیک پیشنهاد', stats.offerClicks], ['بازکردن اعلان', stats.notificationOpens]] as Array<[string, number]>).map(([l, v]) => (
              <article key={l} className="adm-stat"><div className="adm-stat-text"><span className="adm-label">{l}</span><strong className="adm-value">{faNum(v)}</strong></div></article>
            ))}
          </div>
          {mode === 'remote' && stats.diagnostics && <DataHealth stats={stats} />}
          {mode === 'remote' && <InterestsCard interests={stats.interests ?? []} hasEvents={(stats.diagnostics?.people_with_events ?? 0) > 0} />}
          <div className="adm-card"><h3>پرمشاهده‌ترین مقصدها</h3><ul className="adm-chips">{stats.topDestinations.map((d) => <li key={d.id} className="adm-badge">{destName(d.id)} · {faNum(d.viewers)} کاربر</li>)}</ul>
            <h3>فصل‌های محبوب</h3><ul className="adm-chips">{stats.topSeasons.map((d) => <li key={d.name} className="adm-badge">{d.name} · {faNum(d.count)}</li>)}</ul>
            <h3>دسته‌های محبوب</h3><ul className="adm-chips">{stats.topCategories.map((d) => <li key={d.name} className="adm-badge">{d.name} · {faNum(d.count)}</li>)}</ul></div>
          {mode === 'remote' && (
            <div className="adm-card" style={{ display: 'grid', gap: 6 }}>
              <h3>پاک‌سازی مهمان‌های بی‌فعالیت</h3>
              <p className="adm-note">مهمانی که فقط یک‌بار برنامه را باز کرده و برنگشته (مثل ربات، خزنده یا بازدید آزمایشی) آمار را شلوغ می‌کند. این‌ها با رویدادها و رضایت‌هایشان پاک می‌شوند؛ مهمان‌هایی که بیش از یک‌بار برگشته‌اند و حساب‌های ثبت‌نام‌شده دست نمی‌خورند.</p>
              <div className="adm-inline" style={{ gap: 8 }}>
                <select aria-label="مدت بی‌فعالیتی" value={staleDays} onChange={(e) => setStaleDays(Number(e.target.value))}>{[1, 3, 7, 30].map((d) => <option key={d} value={d}>برنگشته در {faNum(d)} روز</option>)}</select>
                <strong>{stale === null ? '…' : faNum(stale)} مورد</strong>
                <button className="adm-btn" disabled={!stale || cleaning} onClick={cleanup}>{cleaning ? 'در حال پاک‌سازی…' : 'پاک‌سازی'}</button>
              </div>
              {notice && <p className="adm-note" role="status">{notice}</p>}
            </div>
          )}
          <details className="adm-card"><summary>تعریف آمارها</summary>{Object.values(stats.definitions).map((t) => <p key={t} className="adm-note">{t}</p>)}</details>
        </>
      )}

      {tab !== 'overview' && <FilterForm value={filters} onChange={changeFilters} />}
      {tab !== 'overview' && Object.keys(filters).length > 0 && <button className="adm-btn" onClick={() => changeFilters({})}>پاک‌کردن فیلترها</button>}

      {tab === 'list' && list && (
        <>
          <p className="adm-note" aria-live="polite">{faNum(list.total)} پروفایل · صفحه {faNum(list.page)} از {faNum(pages)}</p>
          {list.items.length === 0 ? <div className="adm-card adm-empty"><strong>نتیجه‌ای پیدا نشد</strong><p>کاربرانی که داده‌شان ثبت نشده در فیلترهای مربوطه نمی‌آیند.</p></div> : (
            <div className="adm-table-wrap" style={{ display: 'block', overflowX: 'auto' }}>
              <table className="adm-table"><thead><tr><th>شناسه</th><th>وضعیت</th><th>نام</th><th>شهر</th><th>پروفایل</th>{th('first_seen_at', 'اولین مراجعه')}{th('last_active_at', 'آخرین فعالیت')}{th('sessions', 'نشست')}{th('destinations_viewed', 'مقصد')}{th('event_count', 'رویداد')}<th>علایق برتر</th><th>رضایت تبلیغاتی</th><th>اعلان</th><th /></tr></thead>
                <tbody>{list.items.map((u) => (
                  <tr key={u.id}><td dir="ltr">{u.id}</td><td><span className={`adm-badge ${u.status === 'registered' ? 'on' : 'off'}`}>{u.status === 'registered' ? 'ثبت‌نام‌شده' : 'مهمان'}</span>{u.state !== 'active' && ' (غیرفعال)'}</td><td>{u.display_name ?? '—'}</td><td>{u.city ?? '—'}</td><td>{u.status !== 'registered' ? '—' : u.profile_complete === undefined ? '—' : <span className={`adm-badge ${u.profile_complete ? 'on' : 'warn'}`}>{u.profile_complete ? 'کامل' : 'ناقص'}</span>}</td><td>{fmtDate(u.first_seen_at)}</td><td>{fmtDate(u.last_active_at)}</td><td>{faNum(u.sessions)}</td><td>{faNum(u.destinations_viewed)}</td><td>{faNum(u.event_count)}</td><td>{u.top_interests.join('، ') || '—'}</td><td>{consentBadge((u as { consent_marketing?: boolean | null }).consent_marketing)}</td><td>{mode === 'remote' ? ((u as { has_push?: boolean }).has_push ? <span className="adm-badge on">فعال</span> : <span className="adm-badge off">ندارد</span>) : '—'}</td>
                    <td><button className="adm-btn" onClick={() => setOpen(u.id)}>جزئیات</button></td></tr>))}</tbody></table>
            </div>)}
          <div className="adm-form-actions">
            <button className="adm-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</button>
            <button className="adm-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>بعدی</button>
          </div>
        </>
      )}

      {tab === 'audience' && (
        <div className="adm-card" style={{ display: 'grid', gap: 8 }}>
          <h3>مخاطب هدفمند</h3>
          {!can(role, 'audience.preview') ? <p className="adm-note">نقش فعلی دسترسی ندارد.</p> : aud && <>
            <p>مطابق فیلتر: <strong>{faNum(aud.matched)}</strong> · واجد شرایط دریافت: <strong>{faNum(aud.eligible)}</strong></p>
            <p className="adm-note">حذف‌شده — بدون رضایت تبلیغاتی: {faNum(aud.excluded.noMarketingConsent)}{mode === 'remote' ? ` · بدون اشتراک اعلان: ${faNum(aud.excluded.noPushSubscription ?? 0)}` : ''} · لغو اشتراک: {faNum(aud.excluded.unsubscribed)} · سقف تکرار (۷ روز): {faNum(aud.excluded.frequencyCap)} · حساب غیرفعال: {faNum(aud.excluded.inactiveAccount)}</p>
            <p className="adm-note">فقط شمارش نمایش داده می‌شود؛ اطلاعات شخصی گیرندگان نمایش داده نمی‌شود. «واجد شرایط» یعنی رضایت تبلیغاتی داده، اجازهٔ اعلان داده و در ۷ روز اخیر پیشنهادی نگرفته است.</p></>}
          <div className="adm-form">
            <input placeholder="عنوان اعلان (حداکثر ۶۰ نویسه)" aria-label="عنوان" maxLength={60} value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} />
            <textarea placeholder="متن اعلان (حداکثر ۲۰۰ نویسه)" aria-label="متن" rows={3} maxLength={200} value={offer.body} onChange={(e) => setOffer({ ...offer, body: e.target.value })} />
            <select aria-label="صفحهٔ مقصد" value={url} onChange={(e) => setUrl(e.target.value)}>
              {[['/', 'تقویم (صفحهٔ اصلی)'], ['/travel-suggestions', 'پیشنهادهای سفر'], ['/tours', 'تورها'], ['/favorites', 'علاقه‌مندی‌ها']].map(([v, l]) => <option key={v} value={v}>با کلیک باز شود: {l}</option>)}
            </select>
            {offer.title && <div className="adm-card"><strong>{offer.title}</strong><p className="adm-note">{offer.body}</p><span className="adm-badge">پیش‌نمایش · تبلیغاتی</span></div>}
            {mode === 'remote'
              ? <button className="adm-btn primary" disabled={sending || !offer.title.trim() || !offer.body.trim() || !(aud?.eligible)} onClick={send}>{sending ? 'در حال ارسال…' : `ارسال به ${faNum(aud?.eligible ?? 0)} نفر`}</button>
              : <button className="adm-btn" disabled aria-disabled="true" title="نسخهٔ نمایشی چیزی نمی‌فرستد">ارسال (نمایشی؛ غیرفعال)</button>}
            {mode === 'remote' && !aud?.eligible && <p className="adm-note">هنوز کسی واجد شرایط نیست. کاربر باید رضایت تبلیغاتی داده باشد (پیش‌فرض روشن)، در مرورگر «اجازهٔ اعلان» را بدهد و برنامه را یک‌بار باز کند تا اشتراک اعلانش به سرور برسد.</p>}
            {result && <p role="status" className="adm-note"><strong>نتیجه:</strong> {faNum(result.sent)} ارسال شد · {faNum(result.failed)} ناموفق · {faNum(result.removed)} اشتراک منقضی حذف شد (از {faNum(result.targeted)} گیرنده)</p>}
          </div>
          {mode === 'remote' && history.length > 0 && (
            <details><summary>آخرین ارسال‌ها</summary>
              <ul className="adm-timeline" style={{ margin: 0, paddingInlineStart: 18 }}>{history.slice(0, 10).map((h) => <li key={h.at}>{fmtDate(h.at)} — «{h.title}» · {faNum(h.sent)} از {faNum(h.targeted)} ارسال شد{h.failed ? ` · ${faNum(h.failed)} ناموفق` : ''}</li>)}</ul>
            </details>
          )}
        </div>
      )}

      {open && mode === 'remote' && <UserDetailReal api={api} actor={actor} id={open} onClose={() => setOpen(null)} onChanged={() => setRev((x) => x + 1)} />}
      {open && mode === 'demo' && <UserDetailView api={api} role={role} id={open} onClose={() => setOpen(null)} onChanged={() => setRev((x) => x + 1)} />}
    </>
  )
}
