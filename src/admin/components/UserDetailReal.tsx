import { useEffect, useState } from 'react'
import type { Actor, UsersApi } from '../../analytics/admin/api'
import { faNum } from '../../lib/jalali'
import Modal from './Modal'
import { EVENT_LABEL, destName, fmtDate } from './UserDetail'

// جزئیات کاربر در حالت «سرور (واقعی)»: فقط داده‌هایی که واقعاً ثبت می‌شود، با ترتیب ساده.
interface Real {
  id: string; status: 'guest' | 'registered'; state: string; display_name?: string; city?: string; email?: string; profile_complete?: boolean
  first_seen_at: string; last_active_at: string; registered_at?: string; sessions: number; opens?: number; platform?: string; app_version?: string
  anonymous_ids: string[]; contact?: { phone?: string; email?: string }; log?: { at: string; type: string }[]
  event_count?: number; destinations_viewed?: number; offer_clicks?: number; searches?: number; last_event_at?: string
  favorites?: { destination: number[]; tour: number[] }; seasons?: Record<string, number>; filters_used?: Record<string, number>
  viewed_destinations?: { id: number; views: number; approx_seconds: number }[]; viewed_tours?: number[]
  interests?: { interest_key: string; value: string; score: number; confidence: number; source: string }[]
  consent?: Record<string, boolean | null>; consent_log?: { kind: string; granted: boolean; at: string; source: string }[]
}
interface Ev { event_id: string; event_type: string; occurred_at: string; destination_id?: number; tour_id?: number; season?: string }
const CONSENT_FA: Record<string, string> = { analytics: 'تحلیل ناشناس', marketing: 'تبلیغات شخصی‌سازی‌شده', notifications: 'اعلان‌ها (مجوز مرورگر)', location: 'موقعیت (مجوز مرورگر)' }
const SOURCE_FA: Record<string, string> = { default: 'پیش‌فرض', settings: 'تنظیمات', prompt: 'پنجرهٔ رضایت', privacy_page: 'صفحهٔ حریم خصوصی', server: 'سرور', permission: 'مجوز مرورگر' }
const consentFa = (v: boolean | null | undefined) => (v === true ? 'موافق' : v === false ? 'مخالف' : 'ثبت نشده')
const LOG_FA: Record<string, string> = { first_open: 'اولین باز شدن برنامه (نصب)', open: 'ورود به برنامه', register: 'ثبت‌نام با شماره', login: 'ورود با شماره', profile: 'ذخیرهٔ پروفایل' }
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="adm-row2"><span>{k}</span><b>{v || '—'}</b></div>

export default function UserDetailReal({ api, actor, id, onClose, onChanged }: { api: UsersApi; actor: Actor; id: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Real | null>(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [evs, setEvs] = useState<{ items: Ev[]; total: number; page: number; pageSize: number } | null>(null), [evPage, setEvPage] = useState(1)
  useEffect(() => { setD(null); api.detail(actor, id, { includeContact: true }).then((x) => setD(x as unknown as Real)).catch((e) => setErr((e as Error).message)) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setEvs(null); api.events(actor, id, evPage, 10).then((x) => setEvs(x as unknown as typeof evs)).catch(() => setEvs({ items: [], total: 0, page: 1, pageSize: 10 })) }, [id, evPage]) // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (kind: 'disable' | 'remove') => {
    const q = kind === 'disable' ? 'این کاربر غیرفعال شود؟ دیگر نمی‌تواند وارد شود.' : 'این کاربر برای همیشه حذف شود؟ این کار برگشت‌پذیر نیست.'
    if (!window.confirm(q)) return
    setBusy(true)
    try { await (kind === 'disable' ? api.disable(actor, id, id) : api.remove(actor, id, id)); onChanged(); onClose() } catch (e) { setErr((e as Error).message); setBusy(false) }
  }
  const reg = d?.status === 'registered'
  return (
    <Modal title={d?.display_name ?? (reg ? 'کاربر ثبت‌نام‌شده' : 'مهمان')} onClose={onClose} wide>
      {err && <p role="alert" className="adm-note">خطا: {err}</p>}
      {!d && !err && <p className="adm-note">در حال بارگذاری…</p>}
      {d && (
        <div className="adm-detail">
          <section className="adm-card" style={{ display: 'grid', gap: 6 }}>
            <div className="adm-inline" style={{ flexWrap: 'wrap' }}>
              <span className={`adm-badge ${reg ? 'on' : 'off'}`}>{reg ? 'ثبت‌نام‌شده' : 'مهمان (فقط نصب)'}</span>
              {reg && <span className={`adm-badge ${d.profile_complete ? 'on' : 'warn'}`}>{d.profile_complete ? 'پروفایل کامل' : 'پروفایل ناقص'}</span>}
              {d.state !== 'active' && <span className="adm-badge warn">غیرفعال</span>}
            </div>
            <Row k="شمارهٔ موبایل" v={d.contact?.phone ? <span dir="ltr">{d.contact.phone}</span> : reg ? null : 'ثبت‌نام نکرده'} />
            <Row k="شهر" v={d.city} />
            <Row k="ایمیل" v={d.contact?.email ? <span dir="ltr">{d.contact.email}</span> : null} />
          </section>

          <section className="adm-card" style={{ display: 'grid', gap: 6 }}>
            <h3>فعالیت</h3>
            <Row k="اولین مراجعه (نصب)" v={fmtDate(d.first_seen_at)} />
            <Row k="آخرین فعالیت" v={fmtDate(d.last_active_at)} />
            {reg && <Row k="زمان ثبت‌نام" v={fmtDate(d.registered_at)} />}
            <Row k="تعداد نشست" v={faNum(d.sessions)} />
            <Row k="دفعات باز کردن برنامه" v={faNum(d.opens ?? 0)} />
            <Row k="دستگاه" v={d.platform === 'pwa' ? 'برنامهٔ نصب‌شده' : 'مرورگر'} />
            <p className="adm-note">نشست = باز کردن برنامه با فاصلهٔ بیش از ۳۰ دقیقه از مراجعهٔ قبلی.</p>
          </section>

          <section className="adm-card" style={{ display: 'grid', gap: 6 }}>
            <h3>رفتار در برنامه</h3>
            {!d.event_count && <p className="adm-note">رویدادی ثبت نشده؛ یا کاربر هنوز رضایت تحلیل نداده/آن را لغو کرده، یا رویدادها هنوز به سرور نرسیده‌اند.</p>}
            <Row k="رویدادهای ثبت‌شده" v={faNum(d.event_count ?? 0)} />
            <Row k="مقصدهای دیده‌شده" v={faNum(d.destinations_viewed ?? 0)} />
            <Row k="کلیک پیشنهاد / جست‌وجو" v={`${faNum(d.offer_clicks ?? 0)} / ${faNum(d.searches ?? 0)}`} />
            {d.last_event_at && <Row k="آخرین رویداد" v={fmtDate(d.last_event_at)} />}
            {!!d.viewed_destinations?.length && <ul className="adm-chips">{d.viewed_destinations.slice(0, 10).map((v) => <li key={v.id} className="adm-badge">{destName(v.id)} · {faNum(v.views)} بار{v.approx_seconds ? ` · حدود ${faNum(v.approx_seconds)} ثانیه` : ''}</li>)}</ul>}
            <p className="adm-note">علاقه‌مندی‌ها: {d.favorites?.destination.map(destName).join('، ') || '—'}{d.favorites?.tour.length ? ` · تورها: ${d.favorites.tour.map(faNum).join('، ')}` : ''}</p>
            {!!d.interests?.length && <ul className="adm-chips">{d.interests.slice(0, 8).map((i) => <li key={i.interest_key} className="adm-badge">{i.value} · امتیاز {faNum(i.score)}{i.source === 'explicit' ? ' (انتخاب صریح)' : ''}</li>)}</ul>}
            {!!d.seasons && Object.keys(d.seasons).length > 0 && <p className="adm-note">فصل‌های انتخاب‌شده: {Object.entries(d.seasons).map(([k, n]) => `${k} (${faNum(n)})`).join('، ')}</p>}
          </section>

          <section className="adm-card" style={{ display: 'grid', gap: 6 }}>
            <h3>رضایت‌ها</h3>
            {Object.keys(CONSENT_FA).map((k) => <Row key={k} k={CONSENT_FA[k]} v={consentFa(d.consent?.[k])} />)}
            <p className="adm-note">اعلان و موقعیت فقط وقتی «موافق» هستند که مرورگر مجوز را داده باشد. «ثبت نشده» یعنی هنوز رکوردی از دستگاه به سرور نرسیده.</p>
            {!!d.consent_log?.length && <details><summary>تاریخچهٔ رضایت</summary><ul className="adm-timeline" style={{ margin: 0, paddingInlineStart: 18 }}>{d.consent_log.map((c, i) => <li key={i}>{CONSENT_FA[c.kind] ?? c.kind}: {c.granted ? 'موافق' : 'مخالف'} <small className="adm-note">— {SOURCE_FA[c.source] ?? c.source} · {fmtDate(c.at)}</small></li>)}</ul></details>}
          </section>

          <section className="adm-card">
            <h3>آخرین رویدادها</h3>
            {!evs && <p className="adm-note">در حال بارگذاری…</p>}
            {evs && !evs.items.length && <p className="adm-note">موردی ثبت نشده.</p>}
            {!!evs?.items.length && <ul className="adm-timeline" style={{ margin: 0, paddingInlineStart: 18 }}>{evs.items.map((e) => <li key={e.event_id}>{EVENT_LABEL[e.event_type] ?? e.event_type}{e.destination_id != null ? ` · ${destName(e.destination_id)}` : ''}{e.tour_id != null ? ` · تور ${faNum(e.tour_id)}` : ''}{e.season ? ` · ${e.season}` : ''} <small className="adm-note">— {fmtDate(e.occurred_at)}</small></li>)}</ul>}
            {!!evs && evs.total > evs.pageSize && (
              <div className="adm-inline" style={{ marginTop: 6 }}>
                <button className="adm-btn" disabled={evPage <= 1} onClick={() => setEvPage((p) => p - 1)}>قبلی</button>
                <small className="adm-note">صفحهٔ {faNum(evPage)} از {faNum(Math.ceil(evs.total / evs.pageSize))}</small>
                <button className="adm-btn" disabled={evPage >= Math.ceil(evs.total / evs.pageSize)} onClick={() => setEvPage((p) => p + 1)}>بعدی</button>
              </div>
            )}
          </section>

          <section className="adm-card">
            <h3>تاریخچه</h3>
            {d.log?.length ? <ul className="adm-timeline" style={{ margin: 0, paddingInlineStart: 18 }}>{d.log.map((l, i) => <li key={i}>{LOG_FA[l.type] ?? l.type} <small className="adm-note">— {fmtDate(l.at)}</small></li>)}</ul> : <p className="adm-note">موردی ثبت نشده.</p>}
          </section>

          <details className="adm-card"><summary>اطلاعات فنی</summary>
            <Row k="شناسه" v={<span dir="ltr">{d.id}</span>} />
            <Row k="شناسهٔ نصب" v={<span dir="ltr">{d.anonymous_ids.join('، ')}</span>} />
          </details>

          <div className="adm-form-actions">
            <button className="adm-btn" disabled={busy || d.state !== 'active'} onClick={() => void act('disable')}>غیرفعال‌سازی</button>
            <button className="adm-btn" disabled={busy} onClick={() => void act('remove')}>حذف کاربر</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
