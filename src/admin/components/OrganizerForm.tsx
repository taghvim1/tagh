import { useState, type FormEvent } from 'react'
import type { TourOrganizer } from '../../tour-organizers/types'
import { AreaField, Row, TextField } from './fields'
import Modal from './Modal'

interface Props { initial?: TourOrganizer; nextId: number; onSave: (o: TourOrganizer) => void; onClose: () => void }

export default function OrganizerForm({ initial, nextId, onSave, onClose }: Props) {
  const [f, setF] = useState<TourOrganizer>(() => initial ?? { id: nextId, name: '', logo: '', description: '', city: '', phone: '', website: '', instagram: '', active: true })
  const [errors, setErrors] = useState<string[]>([])
  const set = <K extends keyof TourOrganizer>(k: K, v: TourOrganizer[K]) => setF((x) => ({ ...x, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) { setErrors(['نام برگزارکننده الزامی است.']); return }
    onSave({ ...f, name: f.name.trim(), logo: f.logo.trim(), description: f.description.trim(), city: f.city.trim(), phone: f.phone.trim(), website: f.website.trim(), instagram: f.instagram.trim() })
  }

  return (
    <Modal title={initial ? 'ویرایش برگزارکننده' : 'افزودن برگزارکننده'} onClose={onClose}>
      <form className="adm-form" onSubmit={submit} noValidate>
        {errors.length > 0 && <ul className="adm-error-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <TextField label="نام برگزارکننده" value={f.name} onChange={(v) => set('name', v)} />
        <TextField label="لوگو یا تصویر (مسیر یا نشانی فایل)" value={f.logo} onChange={(v) => set('logo', v)} />
        <AreaField label="معرفی کوتاه" value={f.description} onChange={(v) => set('description', v)} rows={3} />
        <Row>
          <TextField label="شهر فعالیت" value={f.city} onChange={(v) => set('city', v)} />
          <TextField label="شماره تماس" value={f.phone} onChange={(v) => set('phone', v)} />
        </Row>
        <Row>
          <TextField label="وب‌سایت" value={f.website} onChange={(v) => set('website', v)} />
          <TextField label="اینستاگرام" value={f.instagram} onChange={(v) => set('instagram', v)} />
        </Row>
        <label className="adm-check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> فعال (تورهای این برگزارکننده نمایش داده شوند)</label>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>
          <button type="submit" className="adm-btn primary">{initial ? 'ذخیرهٔ تغییرات' : 'افزودن'}</button>
        </div>
      </form>
    </Modal>
  )
}
