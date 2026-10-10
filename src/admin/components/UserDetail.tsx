import { useEffect, useState } from 'react'
import { MOCK_DESTINATIONS } from '../../data/destinations'
import { can, type AdminRole } from '../../analytics/admin/access'
import type { UsersApi } from '../../analytics/admin/api'
import type { Page, UserDetail } from '../../analytics/admin/profiles'
import type { ActivityEvent } from '../../analytics/types'
import { faNum } from '../../lib/jalali'
import Modal from './Modal'

export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : '—')
const destName = (id: number) => MOCK_DESTINATIONS.find((d) => d.id === id)?.name ?? `مقصد ${faNum(id)}`
const EVENT_LABEL: Record<string, string> = { view_destination: 'مشاهدهٔ مقصد', destination_dwell: 'مدت مشاهده', select_season: 'انتخاب فصل', search: 'جست‌وجو', favorite_add: 'افزودن علاقه‌مندی', favorite_remove: 'حذف علاقه‌مندی', view_tour: 'مشاهدهٔ تور', offer_click: 'کلیک پیشنهاد', notification_open: 'بازکردن اعلان', use_filter: 'استفاده از فیلتر', app_open: 'ورود به برنامه', view_calendar: 'مشاهدهٔ تقویم', view_suggestions: 'پیشنهاد سفر', view_tours: 'فهرست تورها' }

interface Props { api: UsersApi; role: AdminRole; id: string; onClose: () => void; onChanged: () => void }

export default function UserDetailView({ api, role, id, onClose, onChanged }: Props) {
  const actor = { adminId: 'demo-admin', role }
  const [d, setD] = useState<UserDetail | null>(null)
  const [err, setErr] = useState('')
  const [ev, setEv] = useState<Page<ActivityEvent> | null>(null)
  const [page, setPage] = useState(1)
  const [contact, setContact] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { setD(null); api.detail(actor, id, { includeContact: contact }).then(setD).catch((e) => setErr(e.message)) }, [id, contact, role])
  useEffect(() => { api.events(actor, id, page, 10).then(setEv).catch((e) => setErr(e.message)) }, [id, page, role])

  const act = async (kind: 'disable' | 'remove') => {
    try { await (kind === 'disable' ? api.disable(actor, id, confirm) : api.remove(actor, id, confirm)); onChanged(); onClose() } catch (e) { setMsg((e as Error).message === 'CONFIRMATION_MISMATCH' ? 'شناسه تأیید با شناسهٔ کاربر یکی نیست.' : 'اجازهٔ این عملیات برای نقش فعلی وجود ندارد.') }
  }

  return (
    <Modal title={d?.display_name ?? id} onClose={onClose} wide>
      {err && <p role="alert" className="adm-note">خطا: {err === 'FORBIDDEN:users.view' ? 'دسترسی ندارید' : err}</p>}
      {d && (
        <div className="adm-detail">
          <section><h3>پروفایل و وضعیت</h3>
            <dl className="adm-dl">
              <dt>شناسه</dt><dd dir="ltr">{d.id}</dd>
              <dt>وضعیت</dt><dd>{d.status === 'guest' ? 'مهمان' : 'ثبت‌نام‌شده'} · {d.state === 'active' ? 'فعال' : 'غیرفعال'}</dd>
              <dt>شهر انتخابی</dt><dd>{d.city ?? 'ثبت نشده'}</dd>
              <dt>اولین مراجعه</dt><dd>{fmtDate(d.first_seen_at)}</dd>
              <dt>آخرین فعالیت</dt><dd>{fmtDate(d.last_active_at)}</dd>
              <dt>نشست‌ها</dt><dd>{faNum(d.sessions)}</dd>
              <dt>شناسه‌های ناشناس</dt><dd dir="ltr">{d.anonymous_ids.join(', ')}</dd>
              <dt>تماس</dt>
              <dd>{d.contact ? <span dir="ltr">{d.contact.email ?? d.contact.phone ?? '—'}</span> : can(role, 'users.view_contact') ? <button className="adm-btn" onClick={() => setContact(true)}>نمایش (ثبت در audit log)</button> : 'مخفی (نیاز به مجوز)'}</dd>
            </dl>
          </section>
          <section><h3>علایق (امتیاز و اطمینان)</h3>
            {d.interests.length ? <ul className="adm-chips">{d.interests.slice(0, 10).map((i) => <li key={i.interest_key} className="adm-badge">{i.value} · {faNum(i.score)} · اطمینان {faNum(Math.round(i.confidence * 100))}٪ · {i.source === 'explicit' ? 'صریح' : 'استنباطی'}</li>)}</ul> : <p className="adm-note">داده‌ای نیست.</p>}
          </section>
          <section><h3>مقصدها و تورهای مشاهده‌شده</h3>
            <ul className="adm-chips">{d.viewed_destinations.slice(0, 10).map((v) => <li key={v.id} className="adm-badge">{destName(v.id)} · {faNum(v.views)} بار · حدود {faNum(v.approx_seconds)} ثانیه</li>)}
              {d.viewed_tours.map((t) => <li key={'t' + t} className="adm-badge">تور {faNum(t)}</li>)}</ul>
            <p className="adm-note">مدت مشاهده تقریبی است و معادل توجه واقعی نیست.</p>
          </section>
          <section><h3>فصل‌ها، فیلترها، علاقه‌مندی‌ها و کلیک‌ها</h3>
            <p className="adm-note">فصل‌ها: {Object.entries(d.seasons).map(([k, v]) => `${k} (${faNum(v)})`).join('، ') || '—'}</p>
            <p className="adm-note">فیلترها: {Object.entries(d.filters_used).map(([k, v]) => `${k} (${faNum(v)})`).join('، ') || '—'}</p>
            <p className="adm-note">علاقه‌مندی‌ها: {d.favorites.destination.map(destName).join('، ') || '—'} · کلیک پیشنهاد: {faNum(d.offer_clicks)}</p>
          </section>
          <section><h3>مجوزها و تنظیمات</h3>
            <p className="adm-note">تحلیل: {d.consent.analytics ? 'بله' : 'خیر'} · پیشنهاد تبلیغاتی: {d.consent.marketing ? 'بله' : 'خیر'}{d.notifications.unsubscribed_at ? ' · لغو اشتراک' : ''}</p>
          </section>
          <section><h3>تاریخچهٔ ادغام حساب مهمان</h3>
            {d.merge_logs.length ? <ul className="adm-chips">{d.merge_logs.map((m) => <li key={m.merge_id} className="adm-badge">{fmtDate(m.created_at)} · {m.status} · {faNum(m.events_linked)} رویداد</li>)}</ul> : <p className="adm-note">ادغامی ثبت نشده.</p>}
          </section>
          <section><h3>تاریخچهٔ فعالیت</h3>
            {ev && <>
              <ul className="adm-chips">{ev.items.map((e) => <li key={e.event_id} className="adm-badge">{fmtDate(e.occurred_at)} · {EVENT_LABEL[e.event_type] ?? e.event_type}{e.destination_id != null ? ` · ${destName(e.destination_id)}` : ''}</li>)}</ul>
              <div className="adm-form-actions">
                <button className="adm-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</button>
                <span className="adm-note">صفحه {faNum(ev.page)} از {faNum(Math.max(1, Math.ceil(ev.total / ev.pageSize)))}</span>
                <button className="adm-btn" disabled={page * ev.pageSize >= ev.total} onClick={() => setPage(page + 1)}>بعدی</button>
              </div></>}
          </section>
          {(can(role, 'users.disable') || can(role, 'users.delete')) && (
            <section><h3>عملیات حساس</h3>
              <p className="adm-note">برای تأیید، شناسهٔ کاربر را عیناً وارد کنید. این عملیات در audit log ثبت می‌شود.</p>
              <input dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={d.id} aria-label="تأیید شناسه" />
              <div className="adm-form-actions">
                {can(role, 'users.disable') && <button className="adm-btn danger" disabled={!confirm} onClick={() => act('disable')}>غیرفعال‌کردن</button>}
                {can(role, 'users.delete') && <button className="adm-btn danger solid" disabled={!confirm} onClick={() => act('remove')}>حذف</button>}
              </div>
              {msg && <p role="alert" className="adm-note">{msg}</p>}
            </section>
          )}
        </div>
      )}
      <div className="adm-form-actions"><button className="adm-btn" onClick={onClose}>بستن</button></div>
    </Modal>
  )
}
