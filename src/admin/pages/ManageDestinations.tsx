import { useMemo, useState } from 'react'
import DataTable from '../components/DataTable'
import DestinationForm from '../components/DestinationForm'
import Modal from '../components/Modal'
import type { Destination } from '../../data/destinations'
import { nextId } from '../../lib/localRepository'
import { matchesQuery } from '../../travel/filters'
import { destinationRepo, useDestinations } from '../../travel/repository'

type FormState = { mode: 'add' } | { mode: 'edit'; item: Destination } | null

// مدیریت مقصدها (Local)؛ پارامترهای فصلی مستقیماً توسط موتور پیشنهاد استفاده می‌شوند.
export default function ManageDestinations() {
  const all = useDestinations()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<FormState>(null)
  const [toDelete, setToDelete] = useState<Destination | null>(null)
  const rows = useMemo(() => all.filter((d) => matchesQuery(d, query)), [all, query])

  return (
    <>
      <div className="adm-page-head">
        <div><h2>مدیریت مقصدها</h2><p className="adm-note">افزودن، ویرایش و فعال/غیرفعال‌کردن مقصدها و پارامترهای فصلی</p></div>
        <button className="adm-btn primary" onClick={() => setForm({ mode: 'add' })}>+ افزودن مقصد</button>
      </div>
      <div className="adm-filters two" role="search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی مقصد، شهر یا کشور..." aria-label="جستجوی مقصد" />
      </div>
      <p className="adm-note" aria-live="polite">{rows.length.toLocaleString('fa-IR')} مقصد</p>

      {rows.length > 0 ? (
        <DataTable rows={rows} keyOf={(d) => d.id} columns={[
          { label: 'نام', render: (d) => <strong>{d.name}</strong> },
          { label: 'کشور / استان', render: (d) => `${d.country}${d.province_or_city !== d.name ? ' / ' + d.province_or_city : ''}` },
          { label: 'نوع مقصد', render: (d) => <span className="adm-badge">{d.scope === 'domestic' ? 'داخلی' : 'خارجی'}</span> },
          { label: 'بهترین فصل', render: (d) => d.best_seasons.join('، ') || '—' },
          { label: 'فعال', render: (d) => <input type="checkbox" role="switch" className="adm-switch" aria-label={`فعال بودن ${d.name}`} checked={d.enabled} onChange={(e) => destinationRepo.upsert({ ...d, enabled: e.target.checked })} /> },
          { label: 'عملیات', render: (d) => (
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => setForm({ mode: 'edit', item: d })} aria-label={`ویرایش ${d.name}`}>ویرایش</button>
              <button className="adm-btn danger" onClick={() => setToDelete(d)} aria-label={`حذف ${d.name}`}>حذف</button>
            </div>) },
        ]} />
      ) : (
        <div className="adm-card adm-empty"><strong>مقصدی پیدا نشد</strong><p>عبارت جستجو را تغییر دهید.</p></div>
      )}

      {form && (
        <DestinationForm key={form.mode === 'edit' ? form.item.id : 'new'} initial={form.mode === 'edit' ? form.item : undefined} nextId={nextId(all)}
          onSave={(d) => { destinationRepo.upsert(d); setForm(null) }} onClose={() => setForm(null)} />
      )}
      {toDelete && (
        <Modal title="حذف مقصد" onClose={() => setToDelete(null)}>
          <p>آیا از حذف «{toDelete.name}» مطمئن هستید؟</p>
          <div className="adm-form-actions">
            <button className="adm-btn" onClick={() => setToDelete(null)}>انصراف</button>
            <button className="adm-btn danger solid" onClick={() => { destinationRepo.remove(toDelete.id); setToDelete(null) }}>حذف</button>
          </div>
        </Modal>
      )}
    </>
  )
}
