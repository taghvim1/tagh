import { faNum } from '../lib/jalali'
import { findOrganizer, useOrganizers } from '../tour-organizers/repository'
import { formatDate, formatPrice } from './logic'
import type { Tour } from './types'

interface Props { dateIso: string; tours: Tour[]; onOpenTour: (t: Tour) => void }

// محتوای پنجرهٔ مرکزی تقویم برای روزِ دارای تور: یک تور = معرفی همان تور؛ چند تور = فهرست کارت‌ها.
export default function TourDayPopup({ dateIso, tours, onOpenTour }: Props) {
  const organizers = useOrganizers()
  const org = (t: Tour) => findOrganizer(organizers, t.organizerId)?.name ?? ''

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
