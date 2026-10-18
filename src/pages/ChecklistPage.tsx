import { useState } from 'react'
import AppChrome from '../components/AppChrome'
import CenterModal from '../components/CenterModal'
import TripIcon from '../checklist/TripIcon'
import { COLOR_HUES, TRIP_TYPES } from '../checklist/templates'
import { allTypes, createType, progressOf, useChecklists } from '../lib/checklists'
import { faNum } from '../lib/jalali'
import { navigate } from '../lib/router'
import { useOverlay } from '../lib/overlay'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

function CreateForm({ onDone, onCreated }: { onDone: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState(''), [hue, setHue] = useState(COLOR_HUES[0]), [from, setFrom] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = createType(title, hue, from || undefined)
    if (id) onCreated(id)
  }
  return (
    <form className="ck-form" onSubmit={submit}>
      <h2>نوع سفر تازه</h2>
      <label className="ck-field"><span>نام نوع سفر</span>
        <input className="tp-input" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً سفر دوچرخه‌سواری" autoFocus />
      </label>
      <div className="ck-field" role="group" aria-label="رنگ"><span>رنگ</span>
        <div className="ck-swatches">{COLOR_HUES.map((h) => <button key={h} type="button" className={`ck-swatch${h === hue ? ' on' : ''}`} style={{ '--h': h } as React.CSSProperties} aria-label={`رنگ ${faNum(COLOR_HUES.indexOf(h) + 1)}`} aria-pressed={h === hue} onClick={() => setHue(h)} />)}</div>
      </div>
      <label className="ck-field"><span>شروع از</span>
        <select className="tp-input" value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">چک‌لیست خالی (خودم می‌نویسم)</option>
          {TRIP_TYPES.map((t) => <option key={t.id} value={t.id}>کپی از «{t.title}»</option>)}
        </select>
      </label>
      <div className="nt-actions"><button type="button" className="tp-btn" onClick={onDone}>انصراف</button><button type="submit" className="tp-btn primary" disabled={!title.trim()}>ساخت چک‌لیست</button></div>
    </form>
  )
}

// کاشی‌های انواع سفر (دو ستون) + دکمهٔ بعلاوه برای ساخت نوع سفر شخصی
export default function ChecklistPage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const s = useChecklists()
  const create = useOverlay('ck-create')
  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head">
          <h1>چک‌لیست سفر</h1>
          <p className="tp-lead">نوع سفرت را انتخاب کن تا لیست وسایل لازمش را ببینی.</p>
        </header>
        <div className="ck-grid">
          {allTypes(s).map((t) => {
            const p = progressOf(s, t)
            return (
              <button key={t.id} type="button" className="ck-tile" style={{ '--h': t.hue } as React.CSSProperties} onClick={() => navigate(`/checklist/${t.id}`)}>
                <span className="ck-ico"><TripIcon name={t.icon} /></span>
                <strong className="ck-name">{t.title}</strong>
                <span className="ck-meta">{p.total === 0 ? 'خالی' : p.done === 0 ? `${faNum(p.total)} مورد` : `${faNum(p.done)} از ${faNum(p.total)}`}</span>
                {p.done > 0 && <span className="ck-bar" aria-hidden="true"><i style={{ width: `${(p.done / p.total) * 100}%` }} /></span>}
              </button>
            )
          })}
          <button type="button" className="ck-tile ck-new" aria-haspopup="dialog" onClick={create.show}>
            <span className="ck-ico"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
            <strong className="ck-name">نوع سفر خودم</strong>
            <span className="ck-meta">ساخت چک‌لیست تازه</span>
          </button>
        </div>
      </main>
      <CenterModal open={create.open} onClose={create.hide} label="ساخت نوع سفر"><CreateForm onDone={create.hide} onCreated={(id) => { create.hideSilently(); navigate(`/checklist/${id}`) }} /></CenterModal>
    </div>
  )
}
