import { faNum } from '../lib/jalali'
import { useNotifications } from '../lib/notifications'
import { useOverlay } from '../lib/overlay'
import { goBack } from '../lib/router'
import Drawer from './Drawer'
import NotificationsPanel from './NotificationsPanel'

interface Props {
  /** فقط صفحهٔ اصلی: دکمهٔ همبرگر و منو؛ صفحه‌های داخلی: دکمهٔ بازگشت در همان محل */
  home?: boolean
  /** مقصد دکمهٔ بازگشت اگر صفحهٔ قبلی در برنامه نباشد */
  backFallback?: string
  onToday?: () => void
  title?: string
  overlay?: boolean
}

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

// هدر مشترک: راست = همبرگر (فقط صفحهٔ اصلی) یا بازگشت (صفحه‌های داخلی)، چپ = زنگوله
export default function AppChrome({ home, backFallback = '/', onToday, title, overlay }: Props) {
  const menu = useOverlay('menu')
  const notif = useOverlay('notif')
  const unread = useNotifications().filter((n) => !n.read).length

  return (
    <>
      <header className={`app-header ${overlay ? 'overlay' : 'sticky'}`}>
        {home ? (
          <button type="button" className="hdr-btn" aria-label="باز کردن منو" aria-expanded={menu.open} aria-controls="app-drawer" onClick={menu.show}>
            <svg width="22" height="22" {...svg}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        ) : (
          <button type="button" className="hdr-btn" aria-label="بازگشت" onClick={() => goBack(backFallback)}>
            <svg width="22" height="22" {...svg}><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        <span className="hdr-title">{title}</span>
        <button type="button" className="hdr-btn" aria-label={unread ? `اعلان‌ها (${faNum(unread)} خوانده‌نشده)` : 'اعلان‌ها'} aria-expanded={notif.open} onClick={notif.show}>
          <svg width="22" height="22" {...svg}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0" /></svg>
          {unread > 0 && <span className="hdr-badge">{faNum(unread)}</span>}
        </button>
      </header>
      {home && <Drawer open={menu.open} onClose={menu.hide} onLeave={menu.hideSilently} onToday={onToday} />}
      <NotificationsPanel open={notif.open} onClose={notif.hide} />
    </>
  )
}
