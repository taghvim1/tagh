import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Link } from '../lib/router'

interface Props {
  dark: boolean
  onDarkChange: (value: boolean) => void
  /** گزینهٔ «تاریخ»: برگشت به امروز */
  onToday: () => void
}

const DRAG_START = 8 // حرکت کمتر از این مقدار «کلیک» حساب می‌شود
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const ICONS = {
  date: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  travel: 'M21 3 3 10.5l7 2.5 2.5 7L21 3ZM21 3 10 13',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
  exit: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9',
}

const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
)

export default function Drawer({ dark, onDarkChange, onToday }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'settings'>('menu')
  const [dragX, setDragX] = useState<number | null>(null) // جابه‌جایی لحظه‌ای هنگام کشیدن
  const panel = useRef<HTMLElement>(null)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  const show = () => { setView('menu'); setOpen(true) }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const width = () => panel.current?.offsetWidth ?? 300

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = { x: e.clientX, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > DRAG_START) d.moved = true
    if (d.moved) setDragX(open ? clamp(dx, 0, width()) : clamp(dx, -width(), 0))
  }
  const onUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    setDragX(null)
    if (!d?.moved) return
    dragged.current = true // کلیکِ بعد از کشیدن نباید دوباره تغییر وضعیت دهد
    const dx = e.clientX - d.x
    if (!open && dx < -width() * 0.25) show()
    else if (open && dx > width() * 0.25) setOpen(false)
  }
  const onClick = () => {
    if (dragged.current) { dragged.current = false; return }
    if (open) setOpen(false)
    else show()
  }

  const dragStyle: CSSProperties | undefined = dragX === null ? undefined : { transform: `translateX(calc(${open ? 0 : 100}% + ${dragX}px))`, transition: 'none' }

  return (
    <>
      <button className={`dr-backdrop${open ? ' open' : ''}`} aria-label="بستن منو" tabIndex={-1} onClick={() => setOpen(false)} />
      <aside ref={panel} id="cal-drawer" className={`dr${open ? ' open' : ''}${dragX !== null ? ' dragging' : ''}`} style={dragStyle} aria-label="منوی اصلی">
        <button className="dr-handle" aria-label={open ? 'بستن منو' : 'باز کردن منو'} aria-expanded={open} aria-controls="cal-drawer"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; setDragX(null) }} onClick={onClick} />

        <div className="dr-content">
          {view === 'menu' ? (
            <>
              <h2 className="dr-title">منو</h2>
              <nav className="dr-nav">
                <button className="dr-item active" aria-current="page" onClick={() => { onToday(); setOpen(false) }}><span className="dr-label"><Icon name="date" />تاریخ</span></button>
                <Link to="/travel-suggestions" className="dr-item" onClick={() => setOpen(false)}><span className="dr-label"><Icon name="travel" />پیشنهاد سفر</span></Link>
                {/* گزینه‌های آینده اینجا اضافه می‌شوند */}
                <span className="dr-spacer" />
                <button className="dr-item" onClick={() => setView('settings')}><span className="dr-label"><Icon name="settings" />تنظیمات</span></button>
                <button className="dr-item" aria-disabled="true" title="پس از افزودن ورود به سامانه فعال می‌شود" onClick={(e) => e.preventDefault()}>
                  <span className="dr-label"><Icon name="exit" />خروج</span> <small>به‌زودی</small>
                </button>
              </nav>
            </>
          ) : (
            <>
              <h2 className="dr-title">تنظیمات</h2>
              <label className="dr-switch-row">
                <span>حالت تاریک</span>
                <input type="checkbox" role="switch" className="cal-switch" checked={dark} onChange={(e) => onDarkChange(e.target.checked)} />
              </label>
              <button className="dr-item" onClick={() => setView('menu')}>بازگشت</button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
