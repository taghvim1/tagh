import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

interface Props {
  dark: boolean
  onDarkChange: (value: boolean) => void
}

const DRAG_START = 8 // حرکت کمتر از این مقدار «کلیک» حساب می‌شود
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export default function Drawer({ dark, onDarkChange }: Props) {
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
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; setDragX(null) }} onClick={onClick}>
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
