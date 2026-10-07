import { useState, type FormEvent } from 'react'
import { BUDGETS, COMPANIONS, DURATIONS, LEVEL_LABEL, RATING_LABEL, TRAVEL_TYPES, type Destination, type Level, type Rating, type SeasonKey } from '../../data/destinations'
import { SEASONS } from '../../travel/season'
import { fromDraft, toDraft, type DestinationDraft, type SeasonDraft } from '../destinationDraft'
import { AreaField, CheckGroup, Row, SelectField, TextField } from './fields'
import Modal from './Modal'

interface Props { initial?: Destination; nextId: number; onSave: (d: Destination) => void; onClose: () => void }

const ratingOpts = (Object.keys(RATING_LABEL) as Rating[]).map((k): [string, string] => [k, RATING_LABEL[k]])
const levelOpts = (Object.keys(LEVEL_LABEL) as Level[]).map((k): [string, string] => [k, LEVEL_LABEL[k]])

export default function DestinationForm({ initial, nextId, onSave, onClose }: Props) {
  const [f, setF] = useState<DestinationDraft>(() => toDraft(initial))
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof DestinationDraft>(k: K, v: DestinationDraft[K]) => setF((x) => ({ ...x, [k]: v }))
  const setSeason = (key: SeasonKey, patch: Partial<SeasonDraft>) => setF((x) => ({ ...x, seasons: { ...x.seasons, [key]: { ...x.seasons[key], ...patch } } }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = fromDraft(f, initial?.id ?? nextId)
    if (!r.ok) { setErrors(r.errors); return }
    onSave(r.value)
  }

  return (
    <Modal wide title={initial ? 'ویرایش مقصد' : 'افزودن مقصد'} onClose={onClose}>
      <form className="adm-form" onSubmit={submit} noValidate>
        {errors.length > 0 && <ul className="adm-error-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <Row><TextField label="نام مقصد" value={f.name} onChange={(v) => set('name', v)} /><TextField label="کشور" value={f.country} onChange={(v) => set('country', v)} /></Row>
        <Row>
          <TextField label="استان یا شهر" value={f.province_or_city} onChange={(v) => set('province_or_city', v)} />
          <SelectField label="نوع مقصد" value={f.scope} onChange={(v) => set('scope', v as 'domestic' | 'international')} options={[['domestic', 'داخلی'], ['international', 'خارجی']]} />
        </Row>
        <CheckGroup label="نوع سفر" options={TRAVEL_TYPES} value={f.type} onChange={(v) => set('type', v)} />
        <TextField label="تصویر (مسیر فایل)" value={f.image} onChange={(v) => set('image', v)} placeholder="/images/destinations/1.svg" />
        <AreaField label="توضیحات" value={f.description} onChange={(v) => set('description', v)} />
        <Row>
          <SelectField label="مدت پیشنهادی" value={f.duration} onChange={(v) => set('duration', v as Destination['duration'])} options={DURATIONS} />
          <SelectField label="بودجه" value={f.budget} onChange={(v) => set('budget', v as Destination['budget'])} options={BUDGETS} />
        </Row>
        <CheckGroup label="مناسب برای (فیلتر)" options={COMPANIONS} value={f.companions} onChange={(v) => set('companions', v)} />
        <Row>
          <AreaField label="توضیح مناسب برای" hint="هر مورد در یک خط" value={f.recommended_for} onChange={(v) => set('recommended_for', v)} />
          <AreaField label="جاذبه‌های اصلی" hint="هر مورد در یک خط" value={f.attractions} onChange={(v) => set('attractions', v)} />
        </Row>
        <Row>
          <SelectField label="ویزا (برای شهروند ایرانی)" value={f.visa} onChange={(v) => set('visa', v as DestinationDraft['visa'])} options={[['null', 'ندارد / داخلی'], ['false', 'بدون نیاز به ویزا'], ['true', 'نیازمند ویزا']]} />
          <TextField label="کیفیت (۰ تا ۱۰)" type="number" value={f.quality} onChange={(v) => set('quality', v)} />
        </Row>

        <h3 className="adm-sub">پارامترهای فصلی و آب‌وهوایی</h3>
        {SEASONS.map((s) => {
          const x = f.seasons[s.id]
          return (
            <fieldset key={s.id} className="adm-season-box">
              <legend>{s.title}</legend>
              <Row>
                <SelectField label="تناسب با فصل" value={x.rating} onChange={(v) => setSeason(s.id, { rating: v as Rating })} options={ratingOpts} />
                <TextField label="وضعیت هوا" value={x.weather_condition} onChange={(v) => setSeason(s.id, { weather_condition: v })} />
              </Row>
              <Row>
                <TextField label="میانگین دما" type="number" value={x.average_temperature} onChange={(v) => setSeason(s.id, { average_temperature: v })} />
                <TextField label="حداقل دما" type="number" value={x.temperature_min} onChange={(v) => setSeason(s.id, { temperature_min: v })} />
                <TextField label="حداکثر دما" type="number" value={x.temperature_max} onChange={(v) => setSeason(s.id, { temperature_max: v })} />
              </Row>
              <Row>
                <SelectField label="بارندگی" value={x.rainfall} onChange={(v) => setSeason(s.id, { rainfall: v as Level })} options={levelOpts} />
                <SelectField label="رطوبت" value={x.humidity} onChange={(v) => setSeason(s.id, { humidity: v as Level })} options={levelOpts} />
                <TextField label="اولویت" type="number" value={x.priority} onChange={(v) => setSeason(s.id, { priority: v })} />
              </Row>
              <AreaField label="توضیح جذاب این فصل" rows={2} value={x.description} onChange={(v) => setSeason(s.id, { description: v })} />
            </fieldset>
          )
        })}

        <label className="adm-check"><input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} /> فعال (نمایش در پیشنهاد سفر)</label>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>
          <button type="submit" className="adm-btn primary">{initial ? 'ذخیرهٔ تغییرات' : 'افزودن مقصد'}</button>
        </div>
      </form>
    </Modal>
  )
}
