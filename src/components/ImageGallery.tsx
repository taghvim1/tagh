import { useRef, useState } from 'react'
import { faNum } from '../lib/jalali'

export interface GalleryImage { url: string; credit?: string }

/** گالری قابل ورق‌زدن (کشیدن انگشت/اسکرول افقی، با نقطه‌ها و شمارنده). با یک تصویر مثل تصویر ساده رفتار می‌کند. */
export default function ImageGallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const many = images.length > 1
  const onScroll = () => {
    const el = track.current; if (!el) return
    const w = el.clientWidth || 1
    // در راست‌به‌چپ scrollLeft منفی است؛ قدر مطلق را می‌گیریم
    setI(Math.min(images.length - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / w))))
  }
  const go = (n: number) => { const el = track.current; if (!el) return; const t = Math.min(images.length - 1, Math.max(0, n)); el.scrollTo({ left: (document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl' ? -1 : 1) * t * el.clientWidth, behavior: 'smooth' }) }
  return (
    <div className="dc-gallery">
      <div className="dc-track" ref={track} onScroll={onScroll} role={many ? 'group' : undefined} aria-label={many ? `${alt}، ${images.length} تصویر` : undefined}>
        {images.map((im, k) => <img key={im.url} className="dc-slide" src={im.url} alt={many ? `${alt} ${k + 1}` : alt} loading={k === 0 ? 'eager' : 'lazy'} draggable={false} />)}
      </div>
      {many && <>
        <span className="dc-count" aria-hidden="true">{faNum(i + 1)} / {faNum(images.length)}</span>
        <button type="button" className="dc-nav prev" aria-label="تصویر قبلی" onClick={() => go(i - 1)} disabled={i === 0}>›</button>
        <button type="button" className="dc-nav next" aria-label="تصویر بعدی" onClick={() => go(i + 1)} disabled={i === images.length - 1}>‹</button>
        <div className="dc-dots" aria-hidden="true">{images.map((im, k) => <i key={im.url} className={k === i ? 'on' : ''} />)}</div>
      </>}
      {images[i]?.credit && <p className="dc-credit">تصویر: {images[i].credit}</p>}
    </div>
  )
}
