import type { ReactNode } from 'react'
import { Link } from '../lib/router'

const svg = { viewBox: '0 0 24 24', width: 26, height: 26, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
const Plane = () => <svg {...svg}><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3ZM21 3 10 13" /></svg>
const Note = () => <svg {...svg}><path d="M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2" /><rect x="8" y="2.5" width="8" height="3.5" rx="1" /><path d="M9 11h6M9 15h6" /></svg>
const Luggage = () => <svg {...svg}><rect x="6" y="6.5" width="12" height="13" rx="2.5" /><path d="M9.5 6.5V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M9.5 10v6M14.5 10v6M9 19.5v1.5M15 19.5v1.5" /></svg>

const item = (label: string, icon: ReactNode) => ({ label, icon })

// سه دکمهٔ گرد پایین صفحهٔ اصلی. در صفحهٔ راست‌چین، اولی سمت راست است: پیشنهاد سفر | یادداشت | تورهای پیش‌رو
export default function Dock({ onNote }: { onNote: () => void }) {
  const travel = item('پیشنهاد سفر', <Plane />), note = item('یادداشت روز', <Note />), tours = item('تورهای پیش‌رو', <Luggage />)
  return (
    <nav className="dock" aria-label="دسترسی سریع">
      <Link to="/travel-suggestions" className="dock-btn" aria-label={travel.label} title={travel.label}>{travel.icon}</Link>
      <button type="button" className="dock-btn" aria-haspopup="dialog" aria-label={note.label} title={note.label} onClick={onNote}>{note.icon}</button>
      <Link to="/tours" className="dock-btn" aria-label={tours.label} title={tours.label}>{tours.icon}</Link>
    </nav>
  )
}
