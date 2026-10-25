import { useEffect, useState } from 'react'
import type { Actor, UsersApi } from '../../analytics/admin/api'
import { faNum } from '../../lib/jalali'
import Modal from './Modal'
import { fmtDate } from './UserDetail'

// جزئیات کاربر در حالت «سرور (واقعی)»: فقط داده‌هایی که واقعاً ثبت می‌شود، با ترتیب ساده.
interface Real {
  id: string; status: 'guest' | 'registered'; state: string; display_name?: string; city?: string; email?: string; profile_complete?: boolean
  first_seen_at: string; last_active_at: string; registered_at?: string; sessions: number; opens?: number; platform?: string; app_version?: string
  anonymous_ids: string[]; contact?: { phone?: string; email?: string }; log?: { at: string; type: string }[]
}
const LOG_FA: Record<string, string> = { first_open: 'اولین باز شدن برنامه (نصب)', open: 'ورود به برنامه', register: 'ثبت‌نام با شماره', login: 'ورود با شماره', profile: 'ذخیرهٔ پروفایل' }
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="adm-row2"><span>{k}</span><b>{v || '—'}</b></div>

export default function UserDetailReal({ api, actor, id, onClose, onChanged }: { api: UsersApi; actor: Actor; id: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Real | null>(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { setD(null); api.detail(actor, id, { includeContact: true }).then((x) => setD(x as unknown as Real)).catch((e) => setErr((e as Error).message)) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
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
            <p className="adm-note">نشست = باز کردن برنامه با فاصلهٔ بیش از ۳۰ دقیقه از مراجعهٔ قبلی. بازدید مقصدها و علاقه‌مندی‌ها هنوز به سرور ارسال نمی‌شود.</p>
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
