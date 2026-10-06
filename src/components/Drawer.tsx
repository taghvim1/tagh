import { useEffect, useState } from 'react'
import { Link, navigate, usePath } from '../lib/router'

interface Props {
  open: boolean
  onClose: () => void // بستن با History (دکمه/بیرون/Escape)
  onLeave: () => void // بستن هنگام رفتن به صفحهٔ دیگر
  dark: boolean
  onDarkChange: (value: boolean) => void
  /** در صفحهٔ تقویم: برگشت به امروز */
  onToday?: () => void
}

const ICONS = {
  date: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  travel: 'M21 3 3 10.5l7 2.5 2.5 7L21 3ZM21 3 10 13',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
  exit: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9',
}

const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
)

// پنل راست (۱/۳ عرض صفحه) با Overlay؛ جایگزین منوی کناری قبلی
export default function Drawer({ open, onClose, onLeave, dark, onDarkChange, onToday }: Props) {
  const [view, setView] = useState<'menu' | 'settings'>('menu')
  const path = usePath()

  useEffect(() => { if (open) setView('menu') }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const goDate = () => {
    if (path === '/') { onToday?.(); onClose() } else { onLeave(); navigate('/') }
  }

  return (
    <>
      <button className={`dr-backdrop${open ? ' open' : ''}`} aria-label="بستن منو" tabIndex={-1} onClick={onClose} />
      <aside id="app-drawer" className={`dr${open ? ' open' : ''}`} aria-label="منوی اصلی" aria-hidden={!open}>
        <div className="dr-content">
          {view === 'menu' ? (
            <>
              <h2 className="dr-title">منو</h2>
              <nav className="dr-nav">
                <button className={`dr-item${path === '/' ? ' active' : ''}`} aria-current={path === '/' ? 'page' : undefined} onClick={goDate}><Icon name="date" /><span>تاریخ</span></button>
                <Link to="/travel-suggestions" className={`dr-item${path.startsWith('/travel-suggestions') ? ' active' : ''}`} onClick={onLeave}><Icon name="travel" /><span>پیشنهاد سفر</span></Link>
                {/* گزینه‌های آینده اینجا اضافه می‌شوند */}
                <span className="dr-spacer" />
                <button className="dr-item" onClick={() => setView('settings')}><Icon name="settings" /><span>تنظیمات</span></button>
                <button className="dr-item" aria-disabled="true" title="پس از افزودن ورود به سامانه فعال می‌شود" onClick={(e) => e.preventDefault()}>
                  <Icon name="exit" /><span>خروج</span><small>به‌زودی</small>
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
              <span className="dr-spacer" />
              <button className="dr-item" onClick={() => setView('menu')}><span>بازگشت</span></button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
