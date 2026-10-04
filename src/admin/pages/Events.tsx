import { useMemo, useState } from 'react'
import EventForm, { type EventDraft } from '../components/EventForm'
import EventTable from '../components/EventTable'
import Modal from '../components/Modal'
import { DEFAULT_FILTERS, EVENT_STATUSES, EVENT_TYPES, MOCK_EVENTS, filterEvents, type EventFilters, type EventItem } from '../data/events'
import { faNum } from '../../lib/jalali'

type FormState = { mode: 'add' } | { mode: 'edit'; event: EventItem } | null

// فقط State محلی؛ با Refresh داده‌های Mock اولیه برمی‌گردد.
export default function Events() {
  const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS)
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS)
  const [form, setForm] = useState<FormState>(null)
  const [toDelete, setToDelete] = useState<EventItem | null>(null)

  const visible = useMemo(() => filterEvents(events, filters), [events, filters])
  const hasFilters = filters.query !== '' || filters.type !== 'همه' || filters.status !== 'همه'
  const setFilter = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => setFilters((f) => ({ ...f, [key]: value }))

  const save = (draft: EventDraft) => {
    if (form?.mode === 'edit') {
      const id = form.event.id
      setEvents((list) => list.map((e) => (e.id === id ? { ...draft, id } : e)))
    } else {
      setEvents((list) => [...list, { ...draft, id: Math.max(0, ...list.map((e) => e.id)) + 1 }])
    }
    setForm(null)
  }

  const confirmDelete = () => {
    if (toDelete) setEvents((list) => list.filter((e) => e.id !== toDelete.id))
    setToDelete(null)
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>مناسبت‌ها</h2>
          <p className="adm-note">مدیریت مناسبت‌ها و رویدادهای تقویم</p>
        </div>
        <button className="adm-btn primary" onClick={() => setForm({ mode: 'add' })}>+ افزودن مناسبت</button>
      </div>

      <div className="adm-filters" role="search">
        <input type="search" value={filters.query} onChange={(e) => setFilter('query', e.target.value)} placeholder="جستجوی مناسبت..." aria-label="جستجوی مناسبت" />
        <select value={filters.type} onChange={(e) => setFilter('type', e.target.value as EventFilters['type'])} aria-label="فیلتر نوع">
          <option value="همه">نوع: همه</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value as EventFilters['status'])} aria-label="فیلتر وضعیت">
          <option value="همه">وضعیت: همه</option>
          {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p className="adm-note" aria-live="polite">{faNum(visible.length)} مناسبت از {faNum(events.length)}</p>

      {visible.length > 0 ? (
        <EventTable events={visible} onEdit={(event) => setForm({ mode: 'edit', event })} onDelete={setToDelete} />
      ) : (
        <div className="adm-card adm-empty">
          <strong>{hasFilters ? 'مناسبتی با این فیلترها پیدا نشد' : 'هنوز مناسبتی ثبت نشده است'}</strong>
          <p>{hasFilters ? 'جستجو یا فیلترها را تغییر دهید.' : 'با دکمهٔ «افزودن مناسبت» اولین مناسبت را بسازید.'}</p>
          {hasFilters && <button className="adm-btn" onClick={() => setFilters(DEFAULT_FILTERS)}>پاک‌کردن فیلترها</button>}
        </div>
      )}

      {form && (
        <EventForm key={form.mode === 'edit' ? form.event.id : 'new'} initial={form.mode === 'edit' ? form.event : undefined} onSubmit={save} onClose={() => setForm(null)} />
      )}

      {toDelete && (
        <Modal title="حذف مناسبت" onClose={() => setToDelete(null)}>
          <p>آیا از حذف «{toDelete.title}» مطمئن هستید؟</p>
          <div className="adm-form-actions">
            <button className="adm-btn" onClick={() => setToDelete(null)}>انصراف</button>
            <button className="adm-btn danger solid" onClick={confirmDelete}>حذف</button>
          </div>
        </Modal>
      )}
    </>
  )
}
