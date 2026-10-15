import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getOccasion } from '../lib/calendarData'
import { MONTHS, dayNumber, faNum, fromDayNumber, toGregorianDate, weekdayIndex, type JalaliDate } from '../lib/jalali'
import { noteKey, noteTitle } from '../lib/notes'
import { useHSwipe } from '../lib/useSwipe'
import { toISO } from '../tours/logic'
import type { TourDayMap } from '../tours/calendar'
import type { Tour } from '../tours/types'

/** ۹ لاین: لاین اول و آخر کم‌رنگ (فید)، ۷ لاین وسط = روزها. */
export const LANES = 9
export const FULL = LANES - 2
const LONG_PRESS_MS = 1000
const PAD = 160 // تعداد روزهای اضافه دو طرف
const EXTEND = 120

interface Item { n: number; date: JalaliDate; holiday: boolean; friday: boolean; occ: string; note: string; tours: Tour[] }

interface LaneProps {
  it: Item; isToday: boolean; isSel: boolean
  onSelect: (d: JalaliDate) => void; onLong: (d: JalaliDate) => void
  onOcc: (e: React.MouseEvent, text: string) => void; onNote: (d: JalaliDate) => void; onTours: (d: JalaliDate) => void
}

const Lane = memo(function Lane({ it, isToday, isSel, onSelect, onLong, onOcc, onNote, onTours }: LaneProps) {
  const timer = useRef<{ id: number; x: number; y: number } | null>(null), fired = useRef(false)
  const stop = () => { if (timer.current) { window.clearTimeout(timer.current.id); timer.current = null } }
  useEffect(() => stop, [])
  const label = `${faNum(it.date.day)} ${MONTHS[it.date.month - 1]}${it.occ ? ` — ${it.occ}` : ''}${it.note ? ' — دارای یادداشت' : ''}${it.tours.length ? ' — دارای تور' : ''}`
  const cls = ['wk-lane', isToday && 'now', isSel && 'sel', (it.friday || it.holiday) && 'off'].filter(Boolean).join(' ')
  return (
    <div className={cls} role="listitem" data-n={it.n}>
      <div className="wk-row">
        <button type="button" className="wk-hit" aria-label={label} aria-pressed={isSel}
          onClick={() => { if (fired.current) { fired.current = false; return } onSelect(it.date) }}
          onPointerDown={(e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; stop(); fired.current = false; timer.current = { x: e.clientX, y: e.clientY, id: window.setTimeout(() => { fired.current = true; timer.current = null; onLong(it.date) }, LONG_PRESS_MS) } }}
          onPointerMove={(e) => { const p = timer.current; if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) stop() }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()} />
        <span className="wk-num" aria-hidden="true">{faNum(it.date.day)}</span>
        {it.tours.length > 0 && (
          <button type="button" className="wk-tour" aria-label={it.tours.length === 1 ? `تور: ${it.tours[0].title}` : `${faNum(it.tours.length)} تور`} onClick={() => onTours(it.date)}>
            {it.tours.length === 1 ? it.tours[0].title : 'چند تور'}
          </button>
        )}
        {it.occ ? <button type="button" className={`wk-occ${it.holiday ? ' holiday' : ''}`} onClick={(e) => onOcc(e, it.occ)}><span>{it.occ}</span></button> : <span className="wk-gap" />}
        {it.note && <button type="button" className="wk-note" aria-label={`یادداشت: ${noteTitle(it.note)}`} onClick={() => onNote(it.date)}>{noteTitle(it.note)}</button>}
      </div>
    </div>
  )
})

const Chevron = ({ up }: { up: boolean }) => (
  <svg viewBox="0 0 48 24" width="44" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={up ? 'M6 19 24 5l18 14' : 'M6 5l18 14L42 5'} />
  </svg>
)

interface Props {
  today: JalaliDate
  /** روزی که اولین لاین کامل می‌شود (هنگام ورود) */
  startDate: JalaliDate
  selected: JalaliDate
  tourDays: TourDayMap
  notes: Record<string, string>
  /** برای بازسازی لاین‌ها هنگام تغییر داده‌ها/تنظیمات مناسبت‌ها */
  rev: unknown
  onSelect: (d: JalaliDate) => void
  onNote: (d: JalaliDate) => void
  onTours: (d: JalaliDate) => void
  /** بازگشت به تقویم ماهانه؛ تاریخ اولین لاین کامل داده می‌شود */
  onBack: (first: JalaliDate) => void
}

const vibrate = (ms: number) => { try { navigator.vibrate?.(ms) } catch { /* پشتیبانی نمی‌شود */ } }

export default function WeekView({ today, startDate, selected, tourDays, notes, rev, onSelect, onNote, onTours, onBack }: Props) {
  const startN = useMemo(() => dayNumber(startDate), []) // eslint-disable-line react-hooks/exhaustive-deps -- فقط هنگام ورود
  const todayN = useMemo(() => dayNumber(today), [today])
  const selN = dayNumber(selected)
  const [range, setRange] = useState(() => ({ from: Math.min(startN, todayN) - PAD, to: Math.max(startN, todayN) + FULL + PAD }))
  const [first, setFirst] = useState(startN)
  const [h, setH] = useState(44)
  const [bubble, setBubble] = useState<{ text: string; top: number; below: boolean } | null>(null)

  const body = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null), scroller = useRef<HTMLDivElement>(null)
  const firstRef = useRef(first), rangeRef = useRef(range), hRef = useRef(h), programmatic = useRef(false), prog = useRef(0)
  firstRef.current = first; rangeRef.current = range; hRef.current = h

  // ارتفاع هر لاین از فضای در دسترس
  useLayoutEffect(() => {
    const el = body.current; if (!el) return
    const measure = () => setH(Math.max(34, Math.min(64, Math.floor(el.clientHeight / LANES))))
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // جایگاه اسکرول = (اولین لاین کامل − ۱ − from) × ارتفاع
  useLayoutEffect(() => { const el = scroller.current; if (el) el.scrollTop = (firstRef.current - 1 - rangeRef.current.from) * h }, [h])
  const prevFrom = useRef(range.from)
  useLayoutEffect(() => { // افزودن روزهای قبل از شروع: جایگاه را جبران کن تا چیزی نپرد
    const el = scroller.current; if (el && range.from < prevFrom.current) el.scrollTop += (prevFrom.current - range.from) * hRef.current
    prevFrom.current = range.from
  }, [range.from])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    for (let n = range.from; n <= range.to; n++) {
      const date = fromDayNumber(n), o = getOccasion(date.month, date.day)
      out.push({ n, date, holiday: !!o?.holiday, friday: weekdayIndex(date) === 6, occ: o?.title ?? '', note: notes[noteKey(date)] ?? '', tours: tourDays.get(toISO(toGregorianDate(date))) ?? [] })
    }
    return out
  }, [range, notes, tourDays, rev]) // eslint-disable-line react-hooks/exhaustive-deps

  const raf = useRef(0)
  const onScroll = useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const el = scroller.current; if (!el) return
      const idx = rangeRef.current.from + Math.round(el.scrollTop / hRef.current) + 1
      setBubble(null)
      if (idx !== firstRef.current) {
        firstRef.current = idx; setFirst(idx)
        if (!programmatic.current) vibrate(7) // لرزش سبک با عبور از هر لاین زیر انگشت
        const r = rangeRef.current
        if (idx - r.from < 30) setRange({ ...r, from: r.from - EXTEND })
        else if (r.to - idx < FULL + 30) setRange({ ...r, to: r.to + EXTEND })
      }
    })
  }, [])
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); window.clearTimeout(prog.current) }, [])

  // بستن ابرک مناسبت با لمس هر جای دیگر
  useEffect(() => {
    if (!bubble) return
    const close = () => setBubble(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [bubble])

  const todayVisible = todayN >= first && todayN <= first + FULL - 1
  const toPast = todayN > first + FULL - 1 // هفتهٔ دیده‌شده در گذشته است → فلش رو به بالا
  const goToday = () => {
    const el = scroller.current; if (!el) return
    const dist = todayN - firstRef.current
    programmatic.current = true; window.clearTimeout(prog.current)
    if (Math.abs(dist) > 14) el.scrollTop = (todayN - Math.sign(dist) * 10 - 1 - rangeRef.current.from) * hRef.current // نزدیک می‌شویم، سپس نرم می‌لغزیم
    requestAnimationFrame(() => el.scrollTo({ top: (todayN - 1 - rangeRef.current.from) * hRef.current, behavior: 'smooth' }))
    prog.current = window.setTimeout(() => { programmatic.current = false }, 900)
  }

  const showBubble = useCallback((e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    const fr = frame.current; if (!fr) return
    const f = fr.getBoundingClientRect(), r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const top = r.top - f.top, below = top < 70
    setBubble((b) => (b && b.text === text ? null : { text, top: below ? top + r.height + 8 : top - 8, below }))
  }, [])

  const swipe = useHSwipe(undefined, () => onBack(fromDayNumber(firstRef.current)))
  const head = fromDayNumber(first)

  return (
    <section className="wk" aria-label="تقویم هفتگی" {...swipe} onKeyDown={(e) => { if (e.key === 'Escape') onBack(fromDayNumber(firstRef.current)) }}>
      <button type="button" className="wk-head" onClick={() => onBack(fromDayNumber(firstRef.current))} aria-label={`${MONTHS[head.month - 1]} — بازگشت به تقویم ماهانه`}>
        {MONTHS[head.month - 1]} ماه{head.year !== today.year ? ` ${faNum(head.year)}` : ''}
      </button>
      <div className="wk-body" ref={body}>
        <div className="wk-frame" ref={frame} style={{ height: h * LANES, ['--wk-h' as string]: `${h}px` }}>
          <div className="wk-scroll" ref={scroller} onScroll={onScroll} role="list" aria-label="روزها">
            {items.map((it) => (
              <Lane key={it.n} it={it} isToday={it.n === todayN} isSel={it.n === selN} onSelect={onSelect} onLong={onNote} onOcc={showBubble} onNote={onNote} onTours={onTours} />
            ))}
          </div>
          {!todayVisible && (
            <button key={toPast ? 'up' : 'down'} type="button" className={`wk-arrow ${toPast ? 'up' : 'down'}`} onClick={goToday} aria-label="بازگشت به هفتهٔ جاری">
              <Chevron up={toPast} />
            </button>
          )}
          {bubble && <div className={`wk-bubble${bubble.below ? ' below' : ''}`} style={{ top: bubble.top }} role="status">{bubble.text}</div>}
        </div>
      </div>
    </section>
  )
}
