import { flushSync } from 'react-dom'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getOccasion } from '../lib/calendarData'
import { MONTHS, WEEKDAYS, dayNumber, faNum, fromDayNumber, shiftMonth, toGregorianDate, weekdayIndex, type JalaliDate } from '../lib/jalali'
import { noteKey, noteTitle } from '../lib/notes'
import { weekHapticsEnabled } from '../lib/settings'
import { useHSwipe } from '../lib/useSwipe'
import { toISO } from '../tours/logic'
import type { TourDayMap } from '../tours/calendar'
import type { Tour } from '../tours/types'

/** تعداد لاین‌های دیده‌شده (هفت روز). */
export const LANES = 7
const SLOT = 0.55 // ارتفاع جای فلش (بالا و پایین) نسبت به یک لاین
const BUFFER = 6 // لاین‌های آماده خارج از دید
const LONG_PRESS_MS = 1000
/** ثابت زمانی ایستادن (میلی‌ثانیه): بزرگ‌تر = لغزش طولانی‌تر بعد از رها کردن */
const TAU = 270

interface Item { n: number; date: JalaliDate; holiday: boolean; friday: boolean; weekday: string; occ: string; note: string; tours: Tour[] }

interface LaneProps {
  it: Item; isToday: boolean; isSel: boolean
  onSelect: (d: JalaliDate) => void; onLong: (d: JalaliDate) => void
  onOcc: (e: React.MouseEvent, text: string) => void; onNote: (d: JalaliDate) => void; onTours: (d: JalaliDate) => void
}

const vibrate = (ms: number) => { if (!weekHapticsEnabled()) return; try { navigator.vibrate?.(ms) } catch { /* پشتیبانی نمی‌شود */ } }

const Lane = memo(function Lane({ it, isToday, isSel, onSelect, onLong, onOcc, onNote, onTours }: LaneProps) {
  const timer = useRef<{ id: number; x: number; y: number } | null>(null), fired = useRef(false)
  const stop = () => { if (timer.current) { window.clearTimeout(timer.current.id); timer.current = null } }
  useEffect(() => stop, [])
  const label = `${it.weekday} ${faNum(it.date.day)} ${MONTHS[it.date.month - 1]}${it.occ ? ` — ${it.occ}` : ''}${it.note ? ' — دارای یادداشت' : ''}${it.tours.length ? ' — دارای تور' : ''}`
  const cls = ['wk-lane', isToday && 'now', isSel && 'sel', (it.friday || it.holiday) && 'off'].filter(Boolean).join(' ')
  return (
    <div className={cls} role="listitem">
      <div className="wk-row">
        <button type="button" className="wk-hit" aria-label={label} aria-pressed={isSel}
          onClick={() => { if (fired.current) { fired.current = false; return } onSelect(it.date) }}
          onPointerDown={(e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; stop(); fired.current = false; timer.current = { x: e.clientX, y: e.clientY, id: window.setTimeout(() => { fired.current = true; timer.current = null; vibrate(25); onLong(it.date) }, LONG_PRESS_MS) } }}
          onPointerMove={(e) => { const p = timer.current; if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) stop() }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()} />
        <span className="wk-num" aria-hidden="true">{faNum(it.date.day)}</span>
        <span className="wk-wd" aria-hidden="true">{it.weekday}</span>
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

const MonthArrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'right' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
  </svg>
)

interface Props {
  today: JalaliDate
  /** روزی که اولین لاین می‌شود (هنگام ورود) */
  startDate: JalaliDate
  selected: JalaliDate
  tourDays: TourDayMap
  notes: Record<string, string>
  /** برای بازسازی لاین‌ها هنگام تغییر داده‌ها/تنظیمات مناسبت‌ها */
  rev: unknown
  onSelect: (d: JalaliDate) => void
  onNote: (d: JalaliDate) => void
  onTours: (d: JalaliDate) => void
  /** بازگشت به تقویم ماهانه؛ تاریخ اولین لاین داده می‌شود */
  onBack: (first: JalaliDate) => void
  /** برای بازگشت از بیرون (نقطه‌های صفحه، کشیدن روی کاشی بالا): همین onBack با اولین لاینِ فعلی */
  exitRef?: React.MutableRefObject<(() => void) | null>
}


/**
 * فیزیک اسکرول: لاین‌ها زیر انگشت می‌چسبند؛ با رها کردن، حرکت با سرعت انگشت ادامه پیدا می‌کند
 * (مسافت متناسب با سرعت) و روی یک لاین می‌ایستد. موقعیت به‌صورت عدد اعشاریِ «روز» نگه داشته می‌شود.
 */
export default function WeekView({ today, startDate, selected, tourDays, notes, rev, onSelect, onNote, onTours, onBack, exitRef }: Props) {
  const startN = useMemo(() => dayNumber(startDate), []) // eslint-disable-line react-hooks/exhaustive-deps -- فقط هنگام ورود
  const todayN = useMemo(() => dayNumber(today), [today])
  const selN = dayNumber(selected)
  const [first, setFirst] = useState(startN)
  const [h, setH] = useState(46)
  const [bubble, setBubble] = useState<{ text: string; top: number; below: boolean } | null>(null)

  const body = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null), scroller = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null)
  const pos = useRef(startN), hRef = useRef(h), firstRef = useRef(first)
  const anim = useRef(0), lastBuzz = useRef(0), moved = useRef(false)
  const monthNav = useRef<number | null>(null) // مقصد در حال لغزش هنگام تغییر ماه (برای چند ضربهٔ پشت‌سرهم)
  const monthEl = useRef<HTMLButtonElement>(null), mdrag = useRef<{ id: number; x0: number; moved: boolean } | null>(null), mSuppress = useRef(false)
  hRef.current = h
  if (exitRef) exitRef.current = () => onBack(fromDayNumber(Math.round(pos.current)))
  useEffect(() => () => { if (exitRef) exitRef.current = null }, [exitRef])

  useLayoutEffect(() => {
    const el = body.current; if (!el) return
    const measure = () => setH(Math.max(34, Math.min(64, Math.floor(el.clientHeight / (LANES + 2 * SLOT)))))
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const transformFor = (p: number) => `translate3d(0, ${-(p - (Math.round(p) - BUFFER)) * hRef.current}px, 0)`
  /** لاینی که از لبهٔ بالا/پایین خارج می‌شود کوچک و محو می‌شود (حس انتقال نرم به‌جای برش تیز). */
  const edges = useCallback(() => {
    const tr = track.current; if (!tr) return
    const H = hRef.current, p = pos.current, base = firstRef.current - BUFFER
    for (let i = 0; i < tr.children.length; i++) {
      const y = (base + i - p) * H // بالای این لاین نسبت به بالای کادر
      const out = y < 0 ? -y : y + H - LANES * H // مقدار خروج از کادر (پیکسل)
      const f = out <= 0 ? 1 : Math.max(0, 1 - out / H)
      const el = tr.children[i] as HTMLElement
      if (f >= 1) { if (el.style.opacity) { el.style.opacity = ''; el.style.transform = '' } continue }
      el.style.opacity = String(f * f)
      el.style.transform = `scale(${0.6 + 0.4 * f})`
    }
  }, [])
  const apply = useCallback(() => {
    const idx = Math.round(pos.current)
    if (idx !== firstRef.current) {
      if (Math.abs(idx - firstRef.current) <= 3 || performance.now() - lastBuzz.current > 60) { vibrate(7); lastBuzz.current = performance.now() }
      firstRef.current = idx
      flushSync(() => setFirst(idx)) // لاین‌های تازه همان فریم رندر شوند
    }
    if (track.current) track.current.style.transform = transformFor(pos.current)
    edges()
  }, [edges]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { if (track.current) track.current.style.transform = transformFor(pos.current); edges() }, [h, first, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAnim = () => { if (anim.current) { cancelAnimationFrame(anim.current); anim.current = 0 } }
  /** لغزش نرم تا لاین target؛ سرعت اولیه (لاین بر میلی‌ثانیه) پیوسته می‌ماند. */
  const glide = useCallback((target: number, v0 = 0, fixedTau?: number) => {
    cancelAnim()
    const p0 = pos.current, D = target - p0
    if (Math.abs(D) < 0.001) { pos.current = target; monthNav.current = null; apply(); return }
    const tau = fixedTau ?? (v0 !== 0 && Math.sign(v0) === Math.sign(D) ? Math.min(520, Math.max(120, D / v0)) : Math.min(300, 130 + Math.abs(D) * 40))
    const t0 = performance.now()
    const step = (now: number) => {
      const e = Math.exp(-(now - t0) / tau)
      pos.current = target - D * e
      if (Math.abs(D * e) < 0.01) { pos.current = target; monthNav.current = null; apply(); anim.current = 0; return }
      apply(); anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [apply])
  useEffect(() => () => cancelAnim(), [])

  // لمس/ماوس: لاین‌ها زیر انگشت حرکت می‌کنند
  useEffect(() => {
    const el = scroller.current; if (!el) return
    let drag: { id: number; y0: number; x0: number; last: number; axis: '' | 'x' | 'y'; samples: { t: number; y: number }[] } | null = null
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      cancelAnim(); monthNav.current = null; moved.current = false; setBubble(null)
      drag = { id: e.pointerId, y0: e.clientY, x0: e.clientX, last: e.clientY, axis: '', samples: [{ t: performance.now(), y: e.clientY }] }
    }
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      if (!drag.axis) {
        const dx = Math.abs(e.clientX - drag.x0), dy = Math.abs(e.clientY - drag.y0)
        if (dx < 6 && dy < 6) return
        drag.axis = dy >= dx ? 'y' : 'x'; moved.current = true; setBubble(null)
      }
      if (drag.axis !== 'y') return
      const dy = e.clientY - drag.last; drag.last = e.clientY
      pos.current -= dy / hRef.current; apply()
      const now = performance.now(); drag.samples.push({ t: now, y: e.clientY }); while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift()
    }
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const d = drag; drag = null
      if (d.axis !== 'y') return
      const now = performance.now(), s0 = d.samples[0], s1 = d.samples[d.samples.length - 1]
      const dt = Math.max(1, s1.t - s0.t)
      // انگشتی که بی‌حرکت مانده است سرعت صفر دارد
      let v = now - s1.t > 80 ? 0 : -(s1.y - s0.y) / dt / hRef.current // لاین بر میلی‌ثانیه
      v = Math.max(-6, Math.min(6, v))
      const target = Math.round(pos.current + v * TAU)
      glide(target, v)
    }
    const click = (e: MouseEvent) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false } }
    let wheelTimer = 0
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); cancelAnim(); monthNav.current = null; setBubble(null)
      pos.current += (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) / hRef.current; apply()
      window.clearTimeout(wheelTimer); wheelTimer = window.setTimeout(() => glide(Math.round(pos.current)), 110)
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true); el.removeEventListener('wheel', wheel); window.clearTimeout(wheelTimer)
    }
  }, [apply, glide])

  const cache = useMemo(() => new Map<number, Item>(), [notes, tourDays, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  const itemFor = (n: number): Item => {
    let it = cache.get(n)
    if (!it) {
      const date = fromDayNumber(n), o = getOccasion(date.month, date.day), wi = weekdayIndex(date)
      it = { n, date, holiday: !!o?.holiday, friday: wi === 6, weekday: WEEKDAYS[wi], occ: o?.title ?? '', note: notes[noteKey(date)] ?? '', tours: tourDays.get(toISO(toGregorianDate(date))) ?? [] }
      cache.set(n, it)
    }
    return it
  }

  // بستن ابرک مناسبت با لمس هر جای دیگر
  useEffect(() => {
    if (!bubble) return
    const close = () => setBubble(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [bubble])

  const todayVisible = todayN >= first && todayN <= first + LANES - 1
  const toPast = todayN > first + LANES - 1 // هفتهٔ دیده‌شده در گذشته است → فلش رو به بالا
  const goToday = () => {
    const dist = todayN - Math.round(pos.current)
    if (Math.abs(dist) > 14) { pos.current = todayN - Math.sign(dist) * 10; apply() } // نزدیک می‌شویم، سپس نرم می‌لغزیم
    glide(todayN, 0, 170)
  }

  /** رفتن به روز اولِ ماهِ قبل (delta = -1) یا بعد (delta = +1)؛ تقویم هفته هم با آن عوض می‌شود. */
  const changeMonth = useCallback((delta: number) => {
    const base = fromDayNumber(monthNav.current ?? Math.round(pos.current))
    const m = shiftMonth({ year: base.year, month: base.month }, delta)
    const target = dayNumber({ year: m.year, month: m.month, day: 1 })
    monthNav.current = target; setBubble(null)
    const dist = target - Math.round(pos.current)
    if (Math.abs(dist) > 14) { pos.current = target - Math.sign(dist) * 10; apply() } // نزدیک می‌شویم، سپس نرم می‌لغزیم
    vibrate(10)
    glide(target, 0, 200)
  }, [apply, glide])

  // کشیدن متن ماه به چپ/راست: چپ = ماه بعد، راست = ماه قبل (مثل فلش‌ها)
  const MDRAG_MIN = 36
  const monthDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (e.pointerType === 'mouse' && e.button !== 0) return
    mdrag.current = { id: e.pointerId, x0: e.clientX, moved: false }; mSuppress.current = false
    monthEl.current?.classList.remove('snap')
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* پشتیبانی نمی‌شود */ }
  }
  const monthMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = mdrag.current; if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    if (Math.abs(dx) > 8) d.moved = true
    if (monthEl.current) monthEl.current.style.transform = `translateX(${Math.max(-28, Math.min(28, dx * 0.5))}px)`
  }
  const monthEnd = (e: React.PointerEvent<HTMLButtonElement>, cancelled = false) => {
    e.stopPropagation()
    const d = mdrag.current; if (!d || d.id !== e.pointerId) return
    mdrag.current = null
    const dx = e.clientX - d.x0
    mSuppress.current = d.moved
    if (monthEl.current) { monthEl.current.classList.add('snap'); monthEl.current.style.transform = '' }
    if (!cancelled && d.moved && Math.abs(dx) >= MDRAG_MIN) changeMonth(dx < 0 ? 1 : -1)
  }

  const showBubble = useCallback((e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    const fr = frame.current; if (!fr) return
    const f = fr.getBoundingClientRect(), r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const top = r.top - f.top, below = top < 70
    setBubble((b) => (b && b.text === text ? null : { text, top: below ? top + r.height + 8 : top - 8, below }))
  }, [])

  const swipe = useHSwipe(undefined, () => onBack(fromDayNumber(Math.round(pos.current))))
  const head = fromDayNumber(first)
  const lanes: Item[] = []
  for (let n = first - BUFFER; n <= first + LANES + BUFFER; n++) lanes.push(itemFor(n))

  return (
    <section className="wk" aria-label="تقویم هفتگی" {...swipe}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onBack(fromDayNumber(Math.round(pos.current)))
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); glide(Math.round(pos.current) + (e.key === 'ArrowDown' ? 1 : -1)) }
      }}>
      <div className="wk-head">
        <button type="button" className="wk-hnav" onClick={() => changeMonth(1)} aria-label="ماه بعد"><MonthArrow dir="left" /></button>
        <button type="button" className="wk-month" ref={monthEl}
          onPointerDown={monthDown} onPointerMove={monthMove} onPointerUp={(e) => monthEnd(e)} onPointerCancel={(e) => monthEnd(e, true)}
          onClick={() => { if (mSuppress.current) { mSuppress.current = false; return } onBack(fromDayNumber(Math.round(pos.current))) }}
          aria-label={`${MONTHS[head.month - 1]} — بازگشت به تقویم ماهانه (برای تغییر ماه به چپ یا راست بکشید)`}>
          {MONTHS[head.month - 1]} ماه{head.year !== today.year ? ` ${faNum(head.year)}` : ''}
        </button>
        <button type="button" className="wk-hnav" onClick={() => changeMonth(-1)} aria-label="ماه قبل"><MonthArrow dir="right" /></button>
      </div>
      <div className="wk-body" ref={body}>
        <div className="wk-frame" ref={frame} style={{ ['--wk-h' as string]: `${h}px`, ['--wk-slot' as string]: `${h * SLOT}px` }}>
          <div className="wk-slot">
            {!todayVisible && toPast && (
              <button key="up" type="button" className="wk-arrow up" onClick={goToday} aria-label="بازگشت به هفتهٔ جاری"><Chevron up /></button>
            )}
          </div>
          <div className="wk-scroll" ref={scroller} style={{ height: h * LANES }}>
            <div className="wk-track" ref={track} role="list" aria-label="روزها">
              {lanes.map((it) => <Lane key={it.n} it={it} isToday={it.n === todayN} isSel={it.n === selN} onSelect={onSelect} onLong={onNote} onOcc={showBubble} onNote={onNote} onTours={onTours} />)}
            </div>
          </div>
          <div className="wk-slot">
            {!todayVisible && !toPast && (
              <button key="down" type="button" className="wk-arrow down" onClick={goToday} aria-label="بازگشت به هفتهٔ جاری"><Chevron up={false} /></button>
            )}
          </div>
          {bubble && <div className={`wk-bubble${bubble.below ? ' below' : ''}`} style={{ top: bubble.top }} role="status">{bubble.text}</div>}
        </div>
      </div>
    </section>
  )
}
