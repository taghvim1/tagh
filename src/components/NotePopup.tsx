import { useState } from 'react'
import { formatLongDate, type JalaliDate } from '../lib/jalali'
import { getNote, noteKey, setNote } from '../lib/notes'
import CenterModal from './CenterModal'

interface Props { open: boolean; onClose: () => void; date: JalaliDate }

function Body({ date, onClose }: { date: JalaliDate; onClose: () => void }) {
  const key = noteKey(date)
  const [text, setText] = useState(() => getNote(key))
  // هر تغییر همان لحظه ذخیره می‌شود؛ بستن پنجره به هر روشی چیزی را از دست نمی‌دهد
  const change = (v: string) => { setText(v); setNote(key, v) }
  return (
    <article className="nt">
      <h2>یادداشت</h2>
      <p className="nt-date">{formatLongDate(date)}</p>
      <textarea className="nt-text" value={text} onChange={(e) => change(e.target.value)} rows={8} placeholder="برای این روز بنویس…" aria-label="متن یادداشت" autoFocus />
      <div className="nt-actions">
        {text.trim() && <button type="button" className="tp-btn" onClick={() => change('')}>پاک کردن</button>}
        <button type="button" className="tp-btn primary" onClick={onClose}>ذخیره</button>
      </div>
    </article>
  )
}

// پنجرهٔ یادداشت برای روز انتخاب‌شده در تقویم
export default function NotePopup({ open, onClose, date }: Props) {
  return (
    <CenterModal open={open} onClose={onClose} label="یادداشت روز">
      <Body key={noteKey(date)} date={date} onClose={onClose} />
    </CenterModal>
  )
}
