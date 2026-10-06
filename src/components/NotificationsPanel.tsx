import { useEffect } from 'react'
import { useCalendarData } from '../lib/calendarData'
import { markAllRead, useNotifications } from '../lib/notifications'

interface Props {
  open: boolean
  onClose: () => void
}

const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short' })

export default function NotificationsPanel({ open, onClose }: Props) {
  const items = useNotifications()
  const { updatedAt } = useCalendarData()

  useEffect(() => { if (open) markAllRead() }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <button className={`np-backdrop${open ? ' open' : ''}`} aria-label="بستن اعلان‌ها" tabIndex={-1} onClick={onClose} />
      <section className={`np${open ? ' open' : ''}`} role="dialog" aria-label="اعلان‌ها" aria-hidden={!open}>
        <h2>اعلان‌ها</h2>
        {items.length === 0 ? (
          <p className="np-empty">اعلان جدیدی وجود ندارد.</p>
        ) : (
          <ul>
            {items.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong>
                <p>{n.text}</p>
                <span className="np-time">{fmt.format(n.time)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="np-foot">آخرین به‌روزرسانی داده تقویم: {updatedAt ? fmt.format(updatedAt) : 'نسخهٔ همراه برنامه'}</p>
      </section>
    </>
  )
}
