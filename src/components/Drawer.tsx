import { useState } from 'react'
import { useEscape } from '../lib/useAnimatedMount'
import { Link, navigate, usePath } from '../lib/router'

interface Props {
  open: boolean
  onClose: () => void // بستن با History (دکمه/بیرون/Escape)
  onLeave: () => void // بستن هنگام رفتن به صفحهٔ دیگر
  /** برگشت به امروز در تقویم */
  onToday?: () => void
}

const ICONS = {
  date: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  travel: 'M21 3 3 10.5l7 2.5 2.5 7L21 3ZM21 3 10 13',
  tours: 'M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6ZM12 6v12',
  notes: 'M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M8 12h8M8 16h6',
  favorites: 'M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
  exit: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9',
}
const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]} /></svg>
)

// منوی راست (۱/۳ عرض صفحه) با Overlay؛ فقط در صفحهٔ اصلی در دسترس است
export default function Drawer({ open, onClose, onLeave, onToday }: Props) {
  const path = usePath()
  const [exitHint, setExitHint] = useState(false)
  // مرورگر اجازهٔ بستن تبی را که اسکریپت باز نکرده نمی‌دهد؛ در آن صورت راهنمای دستی نشان داده می‌شود
  const exitApp = () => {
    window.close()
    setTimeout(() => setExitHint(true), 300)
  }
  useEscape(open, onClose)
  const link = (to: string, icon: keyof typeof ICONS, label: string) => (
    <Link to={to} className="dr-item" onClick={onLeave}><Icon name={icon} /><span>{label}</span></Link>
  )
  return (
    <>
      <button className={`dr-backdrop${open ? ' open' : ''}`} aria-label="بستن منو" tabIndex={-1} onClick={onClose} />
      <aside id="app-drawer" className={`dr${open ? ' open' : ''}`} aria-label="منوی اصلی" aria-hidden={!open}>
        <div className="dr-content">
          <h2 className="dr-title">منو</h2>
          <nav className="dr-nav">
            <button className={`dr-item${path === '/' ? ' active' : ''}`} aria-current={path === '/' ? 'page' : undefined} onClick={() => { if (path === '/') { onToday?.(); onClose() } else { onLeave(); navigate('/') } }}><Icon name="date" /><span>تاریخ</span></button>
            {link('/travel-suggestions', 'travel', 'پیشنهاد سفر')}
            {link('/tours', 'tours', 'تورهای پیش‌رو')}
            <span className="dr-spacer" />
            {link('/notes', 'notes', 'یادداشت‌ها')}
            {link('/favorites', 'favorites', 'علاقه‌مندی‌ها')}
            {link('/settings', 'settings', 'تنظیمات')}
            <button className="dr-item" onClick={exitApp}><Icon name="exit" /><span>خروج</span></button>
            {exitHint && <p className="dr-hint" role="status">برای خروج، برنامه را از مرورگر یا فهرست برنامه‌های دستگاه ببندید.</p>}
          </nav>
        </div>
      </aside>
    </>
  )
}
