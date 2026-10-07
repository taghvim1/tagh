import { useMemo, useState } from 'react'
import { useDestinations } from '../../travel/repository'
import { nextId } from '../../lib/localRepository'
import { faNum } from '../../lib/jalali'
import { formatDate, formatPrice } from '../../tours/logic'
import { tourRepo, useTours } from '../../tours/repository'
import { STATUS_LABEL, type Tour, type TourStatus } from '../../tours/types'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import TourForm from '../components/TourForm'

type FormState = { mode: 'add' } | { mode: 'edit'; item: Tour } | null

// مدیریت تورها (Local). تورهای غیرفعال یا پایان‌یافته در بخش «تورهای پیش‌رو» نمایش داده نمی‌شوند.
export default function ManageTours() {
  const tours = useTours()
  const destinations = useDestinations()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<FormState>(null)
  const [toDelete, setToDelete] = useState<Tour | null>(null)

  const rows = useMemo(() => tours.filter((t) =>
    (!query.trim() || `${t.title} ${t.destination_name}`.includes(query.trim())) && (!scope || t.scope === scope) && (!status || t.status === status)), [tours, query, scope, status])

  return (
    <>
      <div className="adm-page-head">
        <div><h2>مدیریت تورها</h2><p className="adm-note">افزودن، ویرایش و فعال/غیرفعال‌کردن تورهای پیش‌رو</p></div>
        <button className="adm-btn primary" onClick={() => setForm({ mode: 'add' })}>+ افزودن تور</button>
      </div>
      <div className="adm-filters" role="search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی تور یا مقصد..." aria-label="جستجوی تور" />
        <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="فیلتر نوع مقصد"><option value="">نوع مقصد: همه</option><option value="domestic">داخلی</option><option value="international">خارجی</option></select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="فیلتر وضعیت"><option value="">وضعیت: همه</option>{(Object.keys(STATUS_LABEL) as TourStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select>
      </div>
      <p className="adm-note" aria-live="polite">{faNum(rows.length)} تور</p>

      {rows.length > 0 ? (
        <DataTable rows={rows} keyOf={(t) => t.id} columns={[
          { label: 'عنوان', render: (t) => <strong>{t.title}</strong> },
          { label: 'مقصد', render: (t) => t.destination_name },
          { label: 'شروع', render: (t) => formatDate(t.start_date) },
          { label: 'قیمت', render: (t) => formatPrice(t.price) },
          { label: 'ظرفیت', render: (t) => `${faNum(t.remaining_capacity)} از ${faNum(t.capacity)}` },
          { label: 'وضعیت', render: (t) => <span className={`adm-badge ${t.status === 'upcoming' ? 'on' : 'off'}`}>{STATUS_LABEL[t.status]}</span> },
          { label: 'فعال', render: (t) => <input type="checkbox" role="switch" className="adm-switch" aria-label={`فعال بودن ${t.title}`} checked={t.enabled} onChange={(e) => tourRepo.upsert({ ...t, enabled: e.target.checked })} /> },
          { label: 'عملیات', render: (t) => (
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => setForm({ mode: 'edit', item: t })} aria-label={`ویرایش ${t.title}`}>ویرایش</button>
              <button className="adm-btn danger" onClick={() => setToDelete(t)} aria-label={`حذف ${t.title}`}>حذف</button>
            </div>) },
        ]} />
      ) : (
        <div className="adm-card adm-empty"><strong>توری پیدا نشد</strong><p>جستجو یا فیلترها را تغییر دهید.</p></div>
      )}

      {form && (
        <TourForm key={form.mode === 'edit' ? form.item.id : 'new'} initial={form.mode === 'edit' ? form.item : undefined} nextId={nextId(tours)} destinations={destinations}
          onSave={(t) => { tourRepo.upsert(t); setForm(null) }} onClose={() => setForm(null)} />
      )}
      {toDelete && (
        <Modal title="حذف تور" onClose={() => setToDelete(null)}>
          <p>آیا از حذف «{toDelete.title}» مطمئن هستید؟</p>
          <div className="adm-form-actions">
            <button className="adm-btn" onClick={() => setToDelete(null)}>انصراف</button>
            <button className="adm-btn danger solid" onClick={() => { tourRepo.remove(toDelete.id); setToDelete(null) }}>حذف</button>
          </div>
        </Modal>
      )}
    </>
  )
}
