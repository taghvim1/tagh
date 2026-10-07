import { useState, type FormEvent } from 'react'
import type { Destination } from '../../data/destinations'
import { DIFFICULTIES, STATUS_LABEL, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, type Tour, type TourStatus } from '../../tours/types'
import { fromTourDraft, toTourDraft, type TourDraft } from '../tourDraft'
import { AreaField, CheckGroup, Row, SelectField, TextField } from './fields'
import Modal from './Modal'

interface Props { initial?: Tour; nextId: number; destinations: Destination[]; onSave: (t: Tour) => void; onClose: () => void }

export default function TourForm({ initial, nextId, destinations, onSave, onClose }: Props) {
  const [f, setF] = useState<TourDraft>(() => toTourDraft(initial))
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof TourDraft>(k: K, v: TourDraft[K]) => setF((x) => ({ ...x, [k]: v }))

  const pickDestination = (id: string) => {
    const d = destinations.find((x) => String(x.id) === id)
    setF((x) => ({ ...x, destination_id: id, scope: d ? d.scope : x.scope }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = fromTourDraft(f, initial?.id ?? nextId, destinations)
    if (!r.ok) { setErrors(r.errors); return }
    onSave(r.value)
  }

  return (
    <Modal wide title={initial ? 'ویرایش تور' : 'افزودن تور'} onClose={onClose}>
      <form className="adm-form" onSubmit={submit} noValidate>
        {errors.length > 0 && <ul className="adm-error-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <TextField label="عنوان تور" value={f.title} onChange={(v) => set('title', v)} />
        <Row>
          <SelectField label="مقصد" value={f.destination_id} onChange={pickDestination} options={[['', 'انتخاب کنید...'], ...destinations.map((d): [string, string] => [String(d.id), d.name])]} />
          <SelectField label="نوع مقصد" value={f.scope} onChange={(v) => set('scope', v as Tour['scope'])} options={[['domestic', 'داخلی'], ['international', 'خارجی']]} />
          <SelectField label="نوع تور" value={f.tour_type} onChange={(v) => set('tour_type', v as Tour['tour_type'])} options={TOUR_TYPES} />
        </Row>
        <TextField label="تصویر (مسیر فایل؛ خالی = تصویر مقصد)" value={f.image} onChange={(v) => set('image', v)} />
        <AreaField label="توضیحات" value={f.description} onChange={(v) => set('description', v)} />
        <Row>
          <TextField label="تاریخ شروع" type="date" value={f.start_date} onChange={(v) => set('start_date', v)} />
          <TextField label="تاریخ پایان" type="date" value={f.end_date} onChange={(v) => set('end_date', v)} />
        </Row>
        <Row>
          <TextField label="قیمت (تومان)" type="number" value={f.price} onChange={(v) => set('price', v)} />
          <SelectField label="بودجه" value={f.budget} onChange={(v) => set('budget', v as Tour['budget'])} options={TOUR_BUDGETS} />
          <SelectField label="سطح سختی" value={f.difficulty} onChange={(v) => set('difficulty', v as Tour['difficulty'])} options={DIFFICULTIES} />
        </Row>
        <Row>
          <TextField label="ظرفیت کل" type="number" value={f.capacity} onChange={(v) => set('capacity', v)} />
          <TextField label="ظرفیت باقی‌مانده" type="number" value={f.remaining_capacity} onChange={(v) => set('remaining_capacity', v)} />
        </Row>
        <Row>
          <TextField label="محل حضور" value={f.meeting_point} onChange={(v) => set('meeting_point', v)} />
          <TextField label="نام راهنما" value={f.guide_name} onChange={(v) => set('guide_name', v)} />
        </Row>
        <CheckGroup label="مناسب برای (فیلتر)" options={TOUR_COMPANIONS} value={f.companions} onChange={(v) => set('companions', v)} />
        <AreaField label="توضیح مناسب برای" hint="هر مورد در یک خط" value={f.recommended_for} onChange={(v) => set('recommended_for', v)} rows={2} />
        <Row>
          <AreaField label="شامل" hint="هر مورد در یک خط" value={f.included_items} onChange={(v) => set('included_items', v)} />
          <AreaField label="شامل نمی‌شود" hint="هر مورد در یک خط" value={f.excluded_items} onChange={(v) => set('excluded_items', v)} />
        </Row>
        <SelectField label="وضعیت" value={f.status} onChange={(v) => set('status', v as TourStatus)} options={(Object.keys(STATUS_LABEL) as TourStatus[]).map((k): [string, string] => [k, STATUS_LABEL[k]])} />
        <label className="adm-check"><input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} /> فعال (نمایش در تورهای پیش‌رو)</label>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>
          <button type="submit" className="adm-btn primary">{initial ? 'ذخیرهٔ تغییرات' : 'افزودن تور'}</button>
        </div>
      </form>
    </Modal>
  )
}
