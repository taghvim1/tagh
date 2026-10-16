import { useEffect, useRef, useState } from 'react'
import type { FeedItem } from '../feed/remote'
import { FEED_CTA, FEED_TITLE, TILE_KINDS } from '../feed/topics'
import { faNum } from '../lib/jalali'
import CenterModal from './CenterModal'

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

/** تصویر با جایگزین آرام (آفلاین یا خطا): کادر رنگی بدون تصویر شکسته */
function Thumb({ src, className }: { src?: string; className: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  return src && !bad
    ? <img className={className} src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} draggable={false} />
    : <span className={`${className} ph`} aria-hidden="true"><svg {...svg} width="30" height="30"><path d="M3 17l5-6 4 4 3-3 6 5M3 5h18v14H3zM15 9.5h.01" /></svg></span>
}

/** لمسِ کاشی با کشیدن افقی (رفتن به صفحهٔ دیگر) اشتباه گرفته نشود */
function useTapGuard() {
  const s = useRef<{ x: number; y: number } | null>(null), moved = useRef(false)
  return {
    handlers: {
      onPointerDown: (e: React.PointerEvent) => { s.current = { x: e.clientX, y: e.clientY }; moved.current = false },
      onPointerUp: (e: React.PointerEvent) => { const p = s.current; s.current = null; moved.current = !!p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10 },
      onPointerCancel: () => { s.current = null; moved.current = true },
    },
    wasDrag: () => { const m = moved.current; moved.current = false; return m },
  }
}

interface TileProps { onOpen: (item: FeedItem) => void }

/** صفحهٔ اول: کاشی «آیا می‌دانستید؟» — تصویر سمت راست، عنوان و چند کلمهٔ اول متن؛ با لمس پاپ‌آپ باز می‌شود. */
export function DykTile({ item, onOpen }: TileProps & { item?: FeedItem }) {
  const g = useTapGuard()
  if (!item) {
    return (
      <div className="fd-tile fd-empty" role="note">
        <Thumb className="fd-img" />
        <span className="fd-text"><strong className="fd-label">آیا می‌دانستید؟</strong><span className="fd-snip">نکته‌های جذاب سفر به‌زودی اینجا منتشر می‌شود.</span></span>
      </div>
    )
  }
  return (
    <button type="button" className="fd-tile" aria-haspopup="dialog" aria-label={`آیا می‌دانستید؟ ${item.title}`} {...g.handlers} onClick={() => { if (!g.wasDrag()) onOpen(item) }}>
      <Thumb className="fd-img" src={item.image.url} />
      <span className="fd-text"><strong className="fd-label">آیا می‌دانستید؟</strong><span className="fd-snip">{item.body}</span></span>
    </button>
  )
}

const ROTATE_MS = 6000
const RESUME_MS = 5000

/** صفحهٔ دوم: کاشی موضوع‌ها (تصویر سمت راست). اسلایدها خودکار می‌چرخند و با کشیدن چپ/راست هم ورق می‌خورند. */
export function TopicTile({ items, paused, onOpen }: TileProps & { items: Partial<Record<(typeof TILE_KINDS)[number], FeedItem>>; paused?: boolean }) {
  const list = TILE_KINDS.flatMap((k) => (items[k] ? [items[k]!] : []))
  const n = list.length
  const track = useRef<HTMLDivElement>(null)
  const idx = useRef(0), holdUntil = useRef(0)
  const dir = () => (track.current && getComputedStyle(track.current).direction === 'rtl' ? -1 : 1)
  const goTo = (i: number) => { const el = track.current; if (el) el.scrollTo({ left: dir() * i * el.clientWidth, behavior: 'smooth' }) }
  const onScroll = () => { const el = track.current; if (el) idx.current = Math.min(n - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / (el.clientWidth || 1)))) }
  const hold = () => { holdUntil.current = Date.now() + RESUME_MS } // کاربر دست زده: چرخش خودکار کمی صبر می‌کند
  useEffect(() => {
    if (n < 2 || paused) return
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() < holdUntil.current) return
      goTo((idx.current + 1) % n)
    }, ROTATE_MS)
    return () => window.clearInterval(t)
  }, [n, paused]) // eslint-disable-line react-hooks/exhaustive-deps
  if (n === 0) {
    return (
      <div className="fd-tile fd-tile2 fd-empty" role="note">
        <Thumb className="fd-img" />
        <span className="fd-text"><strong className="fd-label">پیشنهاد سفر</strong><span className="fd-snip">پیشنهادهای سفر این روزها به‌زودی اینجا منتشر می‌شود.</span></span>
      </div>
    )
  }
  return (
    <div className="fd-track" ref={track} onScroll={onScroll} onPointerDown={hold} onTouchStart={hold} onWheel={hold} role="group" aria-label="موضوع‌های پیشنهاد سفر؛ برای دیدن بعدی بکشید">
      {list.map((it) => (
        <button type="button" key={it.id} className="fd-tile fd-tile2 fd-slide" aria-haspopup="dialog" aria-label={`${FEED_TITLE[it.kind]}: ${it.title}`} onClick={() => onOpen(it)}>
          <Thumb className="fd-img" src={it.image.url} />
          <span className="fd-text"><span className="fd-kicker">{FEED_TITLE[it.kind]}</span><strong className="fd-label">{it.title}</strong><span className="fd-snip">{it.body}</span></span>
        </button>
      ))}
    </div>
  )
}

/** پاپ‌آپ بزرگ: بالا تصویر، پایین متن کامل؛ در پایان منابع. */
export function FeedPopup({ item, open, onClose, onCta }: { item: FeedItem | null; open: boolean; onClose: () => void; onCta: (href: string) => void }) {
  const [shown, setShown] = useState<FeedItem | null>(item)
  useEffect(() => { if (item) setShown(item) }, [item]) // هنگام انیمیشن بسته‌شدن محتوا نپرد
  const it = item ?? shown
  const cta = it ? FEED_CTA[it.kind] : undefined
  const credit = it ? (it.image.attribution || it.image.license) : null
  return (
    <CenterModal open={open && !!it} onClose={onClose} label={it ? `${it.kind === 'dyk' ? 'آیا می‌دانستید؟' : FEED_TITLE[it.kind]}: ${it.title}` : 'جزئیات'}>
      {it && (
        <article className="dc fd-pop">
          <Thumb className="dc-hero" src={it.image.url} />
          {credit && (it.image.source_url
            ? <a className="fd-credit" href={it.image.source_url} target="_blank" rel="noopener noreferrer">تصویر: {credit}</a>
            : <span className="fd-credit">تصویر: {credit}</span>)}
          <header className="dc-head">
            <span className="fd-kicker">{it.kind === 'dyk' ? 'آیا می‌دانستید؟' : FEED_TITLE[it.kind]}</span>
            <h2>{it.title}</h2>
            {it.place && <p className="dc-loc">{it.place}</p>}
          </header>
          <div className="fd-body">{it.body.split(/\n+/).map((p, k) => <p key={k} className="dc-desc">{p}</p>)}</div>
          {it.facts.length > 0 && <dl className="dc-grid">{it.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
          {cta && <div className="dc-actions"><button type="button" className="tp-btn primary" onClick={() => onCta(cta.href)}>{cta.label}</button></div>}
          {it.sources.length > 0 && (
            <section className="dc-block fd-sources" aria-label="منابع">
              <h3>منابع</h3>
              <ul className="dc-list">{it.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>
            </section>
          )}
        </article>
      )}
    </CenterModal>
  )
}
