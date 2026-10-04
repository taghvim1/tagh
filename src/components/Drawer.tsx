import { useEffect, useRef, useState, type PointerEvent } from 'react'

interface Props {
  dark: boolean
  onDarkChange: (value: boolean) => void
}

const DRAG_START = 8 // پیکسل حرکت برای تشخیص «کشیدن» از «کلیک»
const DRAG_OPEN = 30

export default function Drawer({ dark, onDarkChange }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'settings'>('menu')
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  const show = () => { setView('menu'); setOpen(true) }
  const toggle = () => (open ? setOpen(false) : show())

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = { x: e.clientX, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag.current && Math.abs(e.clientX - drag.current.x) > DRAG_START) drag.current.moved = true
  }
  const onUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    dragged.current = true // کلیکِ بعد از کشیدن نباید دوباره تغییر وضعیت دهد
    const dx = e.clientX - d.x
    if (dx < -DRAG_OPEN) show()
    else if (dx > DRAG_OPEN) setOpen(false)
  }
  const onClick = () => {
    if (dragged.current) { dragged.current = false; return }
    toggle()
  }

  return (
    <>
      <button className={`dr-backdrop${open ? ' open' : ''}`} aria-label="بستن منو" tabIndex={-1} onClick={() => setOpen(false)} />
      <aside id="cal-drawer" className={`dr${open ? ' open' : ''}`} aria-label="منوی اصلی">
        <button className="dr-handle" aria-label={open ? 'بستن منو' : 'باز کردن منو'} aria-expanded={open} aria-controls="cal-drawer"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null }} onClick={onClick}>
          <span aria-hidden="true">‹</span>
        </button>

        <div className="dr-content">
          {view === 'menu' ? (
            <>
              <h2 className="dr-title">منو</h2>
              <nav className="dr-nav">
                <button className="dr-item active" aria-current="page" onClick={() => setOpen(false)}>تاریخ</button>
                {/* گزینه‌های آینده اینجا اضافه می‌شوند */}
                <span className="dr-spacer" />
                <button className="dr-item" onClick={() => setView('settings')}>تنظیمات</button>
                <button className="dr-item" aria-disabled="true" title="پس از افزودن ورود به سامانه فعال می‌شود" onClick={(e) => e.preventDefault()}>
                  خروج <small>به‌زودی</small>
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
