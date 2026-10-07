import { formatDate, formatPrice } from './logic'
import { faNum } from '../lib/jalali'
import type { Tour } from './types'

export default function TourCard({ tour: t, onOpen }: { tour: Tour; onOpen: (t: Tour) => void }) {
  return (
    <button type="button" className="tour-card" onClick={() => onOpen(t)} aria-haspopup="dialog">
      <img className="dest-img" src={t.image} alt="" loading="lazy" />
      <span className="tour-body">
        <strong className="tour-title">{t.title}</strong>
        <span className="tour-dest">{t.destination_name}</span>
        <dl className="tour-meta">
          <div><dt>شروع</dt><dd>{formatDate(t.start_date)}</dd></div>
          <div><dt>مدت</dt><dd>{t.duration}</dd></div>
          <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
          <div><dt>ظرفیت باقی‌مانده</dt><dd>{t.remaining_capacity > 0 ? `${faNum(t.remaining_capacity)} نفر` : 'تکمیل'}</dd></div>
        </dl>
      </span>
    </button>
  )
}
