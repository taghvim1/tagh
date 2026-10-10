import { useMemo, useState } from 'react'
import AppChrome from '../components/AppChrome'
import NotePopup from '../components/NotePopup'
import { faNum, formatLongDate, type JalaliDate } from '../lib/jalali'
import { dateOfKey, noteTitle, useNotes } from '../lib/notes'
import { useOverlay } from '../lib/overlay'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// همهٔ یادداشت‌های روزها (ذخیره در همین دستگاه)؛ جدیدترین تاریخ اول
export default function NotesPage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const notes = useNotes()
  const items = useMemo(() => Object.entries(notes)
    .map(([key, text]) => ({ key, text, date: dateOfKey(key) }))
    .filter((n): n is { key: string; text: string; date: JalaliDate } => !!n.date && !!n.text.trim())
    .sort((a, b) => b.date.year - a.date.year || b.date.month - a.date.month || b.date.day - a.date.day), [notes])

  const popup = useOverlay('note-edit')
  const [opened, setOpened] = useState<JalaliDate | null>(null)

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head">
          <h1>یادداشت‌ها</h1>
          <p className="tp-lead">{items.length > 0 ? `${faNum(items.length)} یادداشت` : 'یادداشت‌های روزهای تقویم'}</p>
        </header>
        {items.length === 0 ? (
          <div className="tp-placeholder">
            <strong>هنوز یادداشتی نداری</strong>
            <p>در تقویم، روی یک روز یک ثانیه انگشت را نگه دار تا یادداشتش باز شود.</p>
          </div>
        ) : (
          <div className="dest-grid">
            {items.map((n) => (
              <button key={n.key} type="button" className="note-card" aria-haspopup="dialog" onClick={() => { setOpened(n.date); popup.show() }}>
                <span className="note-title">{noteTitle(n.text)}</span>
                <span className="note-date">{formatLongDate(n.date)}</span>
              </button>
            ))}
          </div>
        )}
      </main>
      {opened && <NotePopup open={popup.open} onClose={popup.hide} date={opened} />}
    </div>
  )
}
