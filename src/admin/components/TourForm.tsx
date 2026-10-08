import { useState, type FormEvent } from 'react'
import type { Destination } from '../../data/destinations'
import type { TourOrganizer } from '../../tour-organizers/types'
import { DIFFICULTIES, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, TRAVEL_STYLES, type Tour } from '../../tours/types'
import { fromTourDraft, toTourDraft, type TourDraft } from '../tourDraft'
import { AreaField, CheckGroup, Row, SelectField, TextField } from './fields'
import Modal from './Modal'

interface Props { initial?: Tour; nextId: number; destinations: Destination[]; organizers: TourOrganizer[]; onSave: (t: Tour) => void; onClose: () => void }

export default function TourForm({ initial, nextId, destinations, organizers, onSave, onClose }: Props) {
  const [f, setF] = useState<TourDraft>(() => toTourDraft(initial))
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof TourDraft>(k: K, v: TourDraft[K]) => setF((x) => ({ ...x, [k]: v }))

  const pickDestination = (id: string) => {
    const d = destinations.find((x) => String(x.id) === id)
    setF((x) => ({ ...x, destinationId: id, scope: d ? d.scope : x.scope }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = fromTourDraft(f, initial?.id ?? nextId, destinations, organizers)
    if (!r.ok) { setErrors(r.errors); return }
    onSave(r.value)
  }

  return (
    <Modal wide title={initial ? 'ویرایش تور' : 'افزودن تور'} onClose={onClose}>
      <form className="adm-form" onSubmit={submit} noValidate>
        {errors.length > 0 && <ul className="adm-error-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <TextField label="عنوان تور" value={f.title} onChange={(v) => set('title', v)} />
        <Row>
          <SelectField label="برگزارکننده" value={f.organizerId} onChange={(v) => set('organizerId', v)} options={[['', 'انتخاب کنید...'], ...organizers.map((o): [string, string] => [String(o.id), o.active ? o.name : `${o.name} (غیرفعال)`])]} />
          <SelectField label="مقصد" value={f.destinationId} onChange={pickDestination} options={[['', 'انتخاب کنید...'], ...destinations.map((d): [string, string] => [String(d.id), d.name])]} />
        </Row>
        <Row>
          <SelectField label="نوع مقصد" value={f.scope} onChange={(v) => set('scope', v as Tour['scope'])} options={[['domestic', 'داخلی'], ['international', 'خارجی']]} />
          <SelectField label="نوع تور" value={f.tourType} onChange={(v) => set('tourType', v as Tour['tourType'])} options={TOUR_TYPES} />
          <SelectField label="سبک سفر" value={f.travelStyle} onChange={(v) => set('travelStyle', v as Tour['travelStyle'])} options={TRAVEL_STYLES} />
        </Row>
        <TextField label="تصویر (مسیر فایل؛ خالی = تصویر مقصد)" value={f.image} onChange={(v) => set('image', v)} />
        <AreaField label="توضیح کوتاه" value={f.shortDescription} onChange={(v) => set('shortDescription', v)} rows={2} />
        <AreaField label="توضیح کامل" value={f.fullDescription} onChange={(v) => set('fullDescription', v)} />
        <Row>
          <TextField label="تاریخ شروع" type="date" value={f.startDate} onChange={(v) => set('startDate', v)} />
          <TextField label="تاریخ پایان" type="date" value={f.endDate} onChange={(v) => set('endDate', v)} />
        </Row>
        <Row>
          <TextField label="قیمت (تومان)" type="number" value={f.price} onChange={(v) => set('price', v)} />
          <SelectField label="بودجه" value={f.budget} onChange={(v) => set('budget', v as Tour['budget'])} options={TOUR_BUDGETS} />
          <SelectField label="سطح سختی" value={f.difficulty} onChange={(v) => set('difficulty', v as Tour['difficulty'])} options={DIFFICULTIES} />
        </Row>
        <Row>
          <TextField label="ظرفیت کل" type="number" value={f.capacity} onChange={(v) => set('capacity', v)} />
          <TextField label="ظرفیت باقی‌مانده" type="number" value={f.remainingCapacity} onChange={(v) => set('remainingCapacity', v)} />
        </Row>
        <Row>
          <TextField label="محل حضور" value={f.meetingPoint} onChange={(v) => set('meetingPoint', v)} />
          <TextField label="نام راهنما" value={f.guideName} onChange={(v) => set('guideName', v)} />
        </Row>
        <CheckGroup label="مناسب برای (فیلتر)" options={TOUR_COMPANIONS} value={f.suitableFor} onChange={(v) => set('suitableFor', v)} />
        <AreaField label="برنامهٔ سفر" hint="هر روز/مرحله در یک خط" value={f.itinerary} onChange={(v) => set('itinerary', v)} />
        <Row>
          <AreaField label="خدمات" hint="هر مورد در یک خط" value={f.services} onChange={(v) => set('services', v)} />
          <AreaField label="شرایط" hint="هر مورد در یک خط" value={f.conditions} onChange={(v) => set('conditions', v)} />
        </Row>
        <Row>
          <TextField label="اطلاعات تماس" value={f.contact} onChange={(v) => set('contact', v)} />
          <TextField label="لینک ثبت‌نام" value={f.registrationLink} onChange={(v) => set('registrationLink', v)} />
        </Row>
        <label className="adm-check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> فعال (نمایش در تقویم و تورهای پیش‌رو)</label>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>
          <button type="submit" className="adm-btn primary">{initial ? 'ذخیرهٔ تغییرات' : 'افزودن تور'}</button>
        </div>
      </form>
    </Modal>
  )
}
