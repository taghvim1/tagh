import { faNum } from '../lib/jalali'
import { formatDate, formatPrice } from './logic'
import type { Tour } from './types'

export default function TourCard({ tour: t, organizerName, onOpen }: { tour: Tour; organizerName?: string; onOpen: (t: Tour) => void }) {
  return (
    <button type="button" className="tour-card" onClick={() => onOpen(t)}>
      <img className="dest-img" src={t.image} alt="" loading="lazy" />
      <span className="tour-body">
        <strong className="tour-title">{t.title}</strong>
        <span className="tour-dest">{t.destinationName}{organizerName ? ` · ${organizerName}` : ''}</span>
        <dl className="tour-meta">
          <div><dt>شروع</dt><dd>{formatDate(t.startDate)}</dd></div>
          <div><dt>مدت</dt><dd>{t.duration}</dd></div>
          <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
          <div><dt>ظرفیت باقی‌مانده</dt><dd>{t.remainingCapacity > 0 ? `${faNum(t.remainingCapacity)} نفر` : 'تکمیل'}</dd></div>
        </dl>
      </span>
    </button>
  )
}
