import { useState, type FormEvent } from 'react'
import { EVENT_STATUSES, EVENT_TYPES, type EventItem, type EventStatus, type EventType } from '../data/events'
import { parseJalaliInput } from '../data/eventDate'
import Modal from './Modal'

export type EventDraft = Omit<EventItem, 'id'>

interface Props {
  /** در حالت ویرایش، مناسبت فعلی */
  initial?: EventItem
  onSubmit: (draft: EventDraft) => void
  onClose: () => void
}

export default function EventForm({ initial, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [dateInput, setDateInput] = useState(initial?.calendar_date ?? '')
  const [type, setType] = useState<EventType>(initial?.type ?? 'ملی')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? 'فعال')
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = dateInput.trim() ? parseJalaliInput(dateInput) : null
    const next = {
      title: title.trim() ? undefined : 'عنوان مناسبت الزامی است.',
      date: !parsed ? 'تاریخ شمسی الزامی است.' : parsed.ok ? undefined : parsed.error,
    }
    setErrors(next)
    if (next.title || next.date || !parsed?.ok) return
    onSubmit({ title: title.trim(), date: parsed.date, calendar_date: parsed.calendar_date, type, description: description.trim(), status })
  }

  return (
    <Modal title={initial ? 'ویرایش مناسبت' : 'افزودن مناسبت'} onClose={onClose}>
      <form className="adm-form" onSubmit={submit} noValidate>
        <label>
          عنوان مناسبت <span className="adm-req" aria-hidden="true">*</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required aria-invalid={!!errors.title} aria-describedby={errors.title ? 'err-title' : undefined} />
        </label>
        {errors.title && <p id="err-title" className="adm-error" role="alert">{errors.title}</p>}

        <label>
          تاریخ شمسی <span className="adm-req" aria-hidden="true">*</span>
          <input value={dateInput} onChange={(e) => setDateInput(e.target.value)} placeholder="۱۴۰۵/۰۱/۱۳" inputMode="numeric" dir="ltr" required aria-invalid={!!errors.date} aria-describedby={errors.date ? 'err-date' : undefined} />
        </label>
        {errors.date && <p id="err-date" className="adm-error" role="alert">{errors.date}</p>}

        <div className="adm-form-row">
          <label>
            نوع مناسبت
            <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>
            وضعیت
            <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)}>
              {EVENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label>
          توضیحات
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="adm-form-actions">
          <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>
          <button type="submit" className="adm-btn primary">{initial ? 'ذخیرهٔ تغییرات' : 'ثبت مناسبت'}</button>
        </div>
      </form>
    </Modal>
  )
}
