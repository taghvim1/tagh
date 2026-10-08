import { useMemo, useState } from 'react'
import { faNum } from '../../lib/jalali'
import { nextId } from '../../lib/localRepository'
import { organizerRepo, useOrganizers } from '../../tour-organizers/repository'
import type { TourOrganizer } from '../../tour-organizers/types'
import { useTours } from '../../tours/repository'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import OrganizerForm from '../components/OrganizerForm'

type FormState = { mode: 'add' } | { mode: 'edit'; item: TourOrganizer } | null

// مدیریت برگزارکنندگان تور (Local). غیرفعال‌کردن برگزارکننده، تورهای او را از تقویم و بخش تورها پنهان می‌کند.
export default function ManageTourOrganizers() {
  const organizers = useOrganizers()
  const tours = useTours()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<FormState>(null)
  const [toDelete, setToDelete] = useState<TourOrganizer | null>(null)

  const rows = useMemo(() => organizers.filter((o) => !query.trim() || `${o.name} ${o.city}`.includes(query.trim())), [organizers, query])
  const tourCount = (id: number) => tours.filter((t) => t.organizerId === id).length

  return (
    <>
      <div className="adm-page-head">
        <div><h2>برگزارکنندگان تور</h2><p className="adm-note">افزودن، ویرایش و فعال/غیرفعال‌کردن برگزارکنندگان</p></div>
        <button className="adm-btn primary" onClick={() => setForm({ mode: 'add' })}>+ افزودن برگزارکننده</button>
      </div>
      <div className="adm-filters" role="search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی نام یا شهر..." aria-label="جستجوی برگزارکننده" />
      </div>
      <p className="adm-note" aria-live="polite">{faNum(rows.length)} برگزارکننده</p>

      {rows.length > 0 ? (
        <DataTable rows={rows} keyOf={(o) => o.id} columns={[
          { label: 'نام', render: (o) => <span>{o.logo && <img className="adm-logo" src={o.logo} alt="" />} <strong>{o.name}</strong></span> },
          { label: 'شهر', render: (o) => o.city || '—' },
          { label: 'تماس', render: (o) => o.phone || '—' },
          { label: 'تعداد تور', render: (o) => faNum(tourCount(o.id)) },
          { label: 'فعال', render: (o) => <input type="checkbox" role="switch" className="adm-switch" aria-label={`فعال بودن ${o.name}`} checked={o.active} onChange={(e) => organizerRepo.upsert({ ...o, active: e.target.checked })} /> },
          { label: 'عملیات', render: (o) => (
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => setForm({ mode: 'edit', item: o })} aria-label={`ویرایش ${o.name}`}>ویرایش</button>
              <button className="adm-btn danger" onClick={() => setToDelete(o)} aria-label={`حذف ${o.name}`}>حذف</button>
            </div>) },
        ]} />
      ) : (
        <div className="adm-card adm-empty"><strong>برگزارکننده‌ای پیدا نشد</strong><p>جستجو را تغییر دهید یا برگزارکنندهٔ جدید اضافه کنید.</p></div>
      )}

      {form && (
        <OrganizerForm key={form.mode === 'edit' ? form.item.id : 'new'} initial={form.mode === 'edit' ? form.item : undefined} nextId={nextId(organizers)}
          onSave={(o) => { organizerRepo.upsert(o); setForm(null) }} onClose={() => setForm(null)} />
      )}
      {toDelete && (
        <Modal title="حذف برگزارکننده" onClose={() => setToDelete(null)}>
          {tourCount(toDelete.id) > 0 ? (
            <>
              <p>«{toDelete.name}» دارای {faNum(tourCount(toDelete.id))} تور ثبت‌شده است. ابتدا تورها را به برگزارکنندهٔ دیگری منتقل یا حذف کنید، یا برگزارکننده را غیرفعال کنید.</p>
              <div className="adm-form-actions"><button className="adm-btn" onClick={() => setToDelete(null)}>بستن</button></div>
            </>
          ) : (
            <>
              <p>آیا از حذف «{toDelete.name}» مطمئن هستید؟</p>
              <div className="adm-form-actions">
                <button className="adm-btn" onClick={() => setToDelete(null)}>انصراف</button>
                <button className="adm-btn danger solid" onClick={() => { organizerRepo.remove(toDelete.id); setToDelete(null) }}>حذف</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
