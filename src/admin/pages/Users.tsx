import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOCK_DESTINATIONS } from '../../data/destinations'
import { can, type AdminRole } from '../../analytics/admin/access'
import { ApiUnavailableError, createDemoApi, createRemoteApi, NotReadyError, type UsersApi } from '../../analytics/admin/api'
import type { AudienceCounts, DashboardStats, ProfileFilters, SortKey } from '../../analytics/admin/query'
import { PRESETS } from '../../analytics/admin/query'
import type { Page, UserSummary } from '../../analytics/admin/profiles'
import { faNum } from '../../lib/jalali'
import UserDetailView, { fmtDate } from '../components/UserDetail'

type Tab = 'overview' | 'list' | 'audience'
const ROLES: Array<[AdminRole, string]> = [['super_admin', 'مدیر کل'], ['support', 'پشتیبان'], ['analyst', 'تحلیلگر'], ['marketing', 'بازاریابی']]
const SEASONS = ['بهار', 'تابستان', 'پاییز', 'زمستان']
const TYPES = ['جنگل', 'کویر', 'ساحل', 'کوهستان', 'تاریخی', 'فرهنگی', 'طبیعت']
const destName = (id: number) => MOCK_DESTINATIONS.find((d) => d.id === id)?.name ?? `مقصد ${faNum(id)}`
const msgOf = (e: unknown) => e instanceof ApiUnavailableError ? 'سرور در دسترس نیست (بک‌اند متصل نیست).' : e instanceof NotReadyError ? 'این قابلیت هنوز آماده نیست.' : (e as Error).message.startsWith('FORBIDDEN') ? 'نقش فعلی اجازهٔ این بخش را ندارد.' : 'خطای ناشناخته'

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

export default function Users() {
  const demo = useMemo(() => createDemoApi(), [])
  const [mode, setMode] = useState<'demo' | 'remote'>('demo')
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

  const fail = (e: unknown) => setErr(msgOf(e))
  useEffect(() => { setErr(''); setStats(null); api.stats(actor).then(setStats).catch(fail) }, [api, role, rev])
  useEffect(() => { if (tab === 'list') api.list(actor, { filters: fixBool(filters), sort, dir, page, pageSize: 10 }).then((p) => { setList(p); setErr('') }).catch((e) => { setList(null); fail(e) }) }, [api, role, tab, filters, sort, dir, page, rev])
  useEffect(() => { if (tab === 'audience') api.audience(actor, { ...fixBool(filters), marketingConsent: undefined }).then((a) => { setAud(a); setErr('') }).catch((e) => { setAud(null); fail(e) }) }, [api, role, tab, filters])
  const changeFilters = useCallback((f: ProfileFilters) => { setFilters(f); setPage(1) }, [])
  const sendTry = () => api.sendOffer(actor, { ...offer, kind: 'promotional', filters }).catch(fail)

  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1
  const th = (k: SortKey, label: string) => <th><button className="adm-btn" style={{ minHeight: 28, border: 0, background: 'none' }} onClick={() => { setDir(sort === k && dir === 'desc' ? 'asc' : 'desc'); setSort(k) }}>{label}{sort === k ? (dir === 'desc' ? ' ▼' : ' ▲') : ''}</button></th>

  return (
    <>
      <div className="adm-page-head"><div><h2>کاربران و تحلیل رفتار</h2></div></div>

      <div className="adm-card" role="note" style={{ borderColor: '#e0b252', background: '#fff8e8', marginBottom: 12 }}>
        <strong>{mode === 'demo' ? 'داده‌ی نمایشی — بک‌اند متصل نیست' : 'اتصال به سرور'}</strong>
        <p className="adm-note">
          {mode === 'demo' ? 'همهٔ کاربران این صفحه ساختگی‌اند و فقط برای نمایش رابط تولید می‌شوند. داده‌ی واقعی کاربران فقط از طریق API امن سرور قابل نمایش است و هنوز چنین سرویسی وجود ندارد. انتخاب نقش در این صفحه یک شبیه‌سازی است و امنیت واقعی ایجاد نمی‌کند؛ مجوزها باید در سرور اعمال شوند.' : 'اگر سرور در دسترس نباشد، خطا نمایش داده می‌شود و هیچ داده ساختگی جایگزین نمی‌شود.'}
        </p>
        <div className="adm-filters two">
          <select aria-label="نقش نمایشی" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>{ROLES.map(([r, l]) => <option key={r} value={r}>نقش: {l}</option>)}</select>
          <select aria-label="منبع داده" value={mode} onChange={(e) => { setMode(e.target.value as 'demo' | 'remote'); setList(null); setAud(null) }}><option value="demo">منبع: نمایشی</option><option value="remote">منبع: سرور (آماده نیست)</option></select>
        </div>
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
            {([['کل پروفایل‌ها', stats.total], ['مهمان', stats.guests], ['ثبت‌نام‌شده', stats.registered], ['فعال روزانه', stats.dau], ['فعال هفتگی', stats.wau], ['فعال ماهانه', stats.mau], ['جدید (۳۰ روز)', stats.newProfiles], ['بازگشتی', stats.returning], ['نشست‌ها (۳۰ روز)', stats.sessions], ['علاقه‌مندی‌ها', stats.favorites], ['جست‌وجوها', stats.searches], ['کلیک پیشنهاد', stats.offerClicks], ['بازکردن اعلان', stats.notificationOpens]] as Array<[string, number]>).map(([l, v]) => (
              <article key={l} className="adm-stat"><div className="adm-stat-text"><span className="adm-label">{l}</span><strong className="adm-value">{faNum(v)}</strong></div></article>
            ))}
          </div>
          <div className="adm-card"><h3>پرمشاهده‌ترین مقصدها</h3><ul className="adm-chips">{stats.topDestinations.map((d) => <li key={d.id} className="adm-badge">{destName(d.id)} · {faNum(d.viewers)} کاربر</li>)}</ul>
            <h3>فصل‌های محبوب</h3><ul className="adm-chips">{stats.topSeasons.map((d) => <li key={d.name} className="adm-badge">{d.name} · {faNum(d.count)}</li>)}</ul>
            <h3>دسته‌های محبوب</h3><ul className="adm-chips">{stats.topCategories.map((d) => <li key={d.name} className="adm-badge">{d.name} · {faNum(d.count)}</li>)}</ul></div>
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
              <table className="adm-table"><thead><tr><th>شناسه</th><th>وضعیت</th><th>نام</th><th>شهر</th>{th('first_seen_at', 'اولین مراجعه')}{th('last_active_at', 'آخرین فعالیت')}{th('sessions', 'نشست')}{th('destinations_viewed', 'مقصد')}<th>علایق برتر</th><th /></tr></thead>
                <tbody>{list.items.map((u) => (
                  <tr key={u.id}><td dir="ltr">{u.id}</td><td><span className={`adm-badge ${u.status === 'registered' ? 'on' : 'off'}`}>{u.status === 'registered' ? 'ثبت‌نام‌شده' : 'مهمان'}</span>{u.state !== 'active' && ' (غیرفعال)'}</td><td>{u.display_name ?? '—'}</td><td>{u.city ?? '—'}</td><td>{fmtDate(u.first_seen_at)}</td><td>{fmtDate(u.last_active_at)}</td><td>{faNum(u.sessions)}</td><td>{faNum(u.destinations_viewed)}</td><td>{u.top_interests.join('، ') || '—'}</td>
                    <td><button className="adm-btn" onClick={() => setOpen(u.id)}>جزئیات</button></td></tr>))}</tbody></table>
            </div>)}
          <div className="adm-form-actions">
            <button className="adm-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</button>
            <button className="adm-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>بعدی</button>
          </div>
        </>
      )}

      {tab === 'audience' && (
        <div className="adm-card">
          <h3>پیش‌نمایش مخاطب</h3>
          {!can(role, 'audience.preview') ? <p className="adm-note">نقش فعلی دسترسی ندارد.</p> : aud && <>
            <p>مطابق فیلتر: <strong>{faNum(aud.matched)}</strong> · واجد شرایط دریافت: <strong>{faNum(aud.eligible)}</strong></p>
            <p className="adm-note">حذف‌شده — بدون رضایت تبلیغاتی: {faNum(aud.excluded.noMarketingConsent)} · لغو اشتراک: {faNum(aud.excluded.unsubscribed)} · سقف تکرار (۷ روز): {faNum(aud.excluded.frequencyCap)} · حساب غیرفعال: {faNum(aud.excluded.inactiveAccount)}</p>
            <p className="adm-note">فقط شمارش نمایش داده می‌شود؛ اطلاعات شخصی گیرندگان نمایش داده نمی‌شود.</p></>}
          <div className="adm-form">
            <input placeholder="عنوان پیشنهاد" aria-label="عنوان" value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} />
            <textarea placeholder="متن پیشنهاد" aria-label="متن" rows={3} value={offer.body} onChange={(e) => setOffer({ ...offer, body: e.target.value })} />
            {offer.title && <div className="adm-card"><strong>{offer.title}</strong><p className="adm-note">{offer.body}</p><span className="adm-badge">پیش‌نمایش · تبلیغاتی</span></div>}
            <button className="adm-btn" disabled aria-disabled="true" title="ارسال واقعی غیرفعال است" onClick={sendTry}>ارسال (غیرفعال)</button>
            <p className="adm-note">ارسال واقعی تا اتصال سرویس معتبر اعلان، سرور رضایت‌ها و تأیید مدیر فعال نمی‌شود.</p>
          </div>
        </div>
      )}

      {open && <UserDetailView api={api} role={role} id={open} onClose={() => setOpen(null)} onChanged={() => setRev((x) => x + 1)} />}
    </>
  )
}
