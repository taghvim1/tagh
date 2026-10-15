import { useRef, useState } from 'react'
import { faNum } from '../lib/jalali'
import { findOrganizer, useOrganizers } from '../tour-organizers/repository'
import { formatDate, formatPrice } from './logic'
import type { Tour } from './types'

interface Props { dateIso: string; tours: Tour[]; onOpenTour: (t: Tour) => void; /** چند تور: کارت‌ها با کشیدن چپ و راست ورق زده شوند (به‌جای فهرست) */ carousel?: boolean }

// محتوای پنجرهٔ مرکزی تقویم برای روزِ دارای تور: یک تور = معرفی همان تور؛ چند تور = فهرست کارت‌ها.
function TourSlides({ dateIso, tours, onOpenTour }: Omit<Props, 'carousel'>) {
  const track = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const onScroll = () => { const el = track.current; if (el) setI(Math.min(tours.length - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / (el.clientWidth || 1))))) }
  return (
    <div className="td-carousel">
      <header className="dc-head td-head"><h2>{formatDate(dateIso)}</h2><p className="dc-loc">{faNum(tours.length)} تور در این روز · بکشید</p></header>
      <div className="td-track" ref={track} onScroll={onScroll} role="group" aria-label="تورهای این روز">
        {tours.map((t) => <div key={t.id} className="td-slide"><TourOne t={t} onOpenTour={onOpenTour} /></div>)}
      </div>
      <div className="td-dots" aria-hidden="true">{tours.map((t, k) => <i key={t.id} className={k === i ? 'on' : ''} />)}</div>
    </div>
  )
}

function TourOne({ t, onOpenTour }: { t: Tour; onOpenTour: (t: Tour) => void }) {
  const organizers = useOrganizers()
  const org = findOrganizer(organizers, t.organizerId)?.name ?? ''
  return (
    <article className="dc td">
      <img className="dc-hero" src={t.image} alt={t.title} />
      <header className="dc-head"><h2>{t.title}</h2><p className="dc-loc">{org}</p></header>
      <p className="dc-desc">{t.shortDescription}</p>
      <dl className="dc-grid">
        <div><dt>تاریخ</dt><dd>{formatDate(t.startDate)}{t.endDate !== t.startDate ? ` تا ${formatDate(t.endDate)}` : ''}</dd></div>
        <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
        <div><dt>برگزارکننده</dt><dd>{org}</dd></div>
      </dl>
      <div className="dc-actions"><button type="button" className="tp-btn primary" onClick={() => onOpenTour(t)}>مشاهده پکیج تور</button></div>
    </article>
  )
}

export default function TourDayPopup({ dateIso, tours, onOpenTour, carousel }: Props) {
  const organizers = useOrganizers()
  const org = (t: Tour) => findOrganizer(organizers, t.organizerId)?.name ?? ''

  if (carousel && tours.length > 1) return <TourSlides dateIso={dateIso} tours={tours} onOpenTour={onOpenTour} />

  if (tours.length === 1) {
    const t = tours[0]
    return (
      <article className="dc td">
        <img className="dc-hero" src={t.image} alt={t.title} />
        <header className="dc-head"><h2>{t.title}</h2><p className="dc-loc">{org(t)}</p></header>
        <p className="dc-desc">{t.shortDescription}</p>
        <dl className="dc-grid">
          <div><dt>تاریخ</dt><dd>{formatDate(t.startDate)}{t.endDate !== t.startDate ? ` تا ${formatDate(t.endDate)}` : ''}</dd></div>
          <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
          <div><dt>برگزارکننده</dt><dd>{org(t)}</dd></div>
        </dl>
        <div className="dc-actions"><button type="button" className="tp-btn primary" onClick={() => onOpenTour(t)}>مشاهده پکیج تور</button></div>
      </article>
    )
  }

  return (
    <article className="dc td">
      <header className="dc-head td-head"><h2>{formatDate(dateIso)}</h2><p className="dc-loc">{faNum(tours.length)} تور در این روز</p></header>
      <ul className="td-list">
        {tours.map((t) => (
          <li key={t.id} className="td-card">
            <img className="td-img" src={t.image} alt="" loading="lazy" />
            <div className="td-info">
              <strong>{t.title}</strong>
              <span className="dc-loc">{org(t)}</span>
              <span>{formatPrice(t.price)}</span>
              <button type="button" className="tp-btn primary" onClick={() => onOpenTour(t)}>مشاهده پکیج تور</button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
