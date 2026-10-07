import { toggleFavorite, useFavorites } from '../lib/favorites'
import { faNum } from '../lib/jalali'
import { formatDate, formatPrice } from './logic'
import type { Tour } from './types'

export default function TourContent({ tour: t, onClose }: { tour: Tour; onClose: () => void }) {
  const fav = useFavorites().tour.includes(t.id)
  const booking = t.remaining_capacity === 0 ? 'ظرفیت تکمیل است' : 'ثبت‌نام آنلاین فعلاً فعال نیست (فقط معرفی تور)'
  return (
    <article className="dc">
      <img className="dc-hero" src={t.image} alt={t.title} />
      <header className="dc-head">
        <h2>{t.title}</h2>
        <p className="dc-loc">{t.destination_name}</p>
      </header>
      <p className="dc-desc">{t.description}</p>

      <section className="dc-block">
        <h3>مشخصات تور</h3>
        <dl className="dc-grid">
          <div><dt>تاریخ شروع</dt><dd>{formatDate(t.start_date)}</dd></div>
          <div><dt>تاریخ پایان</dt><dd>{formatDate(t.end_date)}</dd></div>
          <div><dt>مدت</dt><dd>{t.duration}</dd></div>
          <div><dt>محل حضور</dt><dd>{t.meeting_point}</dd></div>
          <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
          <div><dt>ظرفیت</dt><dd>{faNum(t.capacity)} نفر</dd></div>
          <div><dt>ظرفیت باقی‌مانده</dt><dd>{faNum(t.remaining_capacity)} نفر</dd></div>
          <div><dt>نوع تور</dt><dd>{t.tour_type}</dd></div>
          <div><dt>سطح سختی</dt><dd>{t.difficulty}</dd></div>
          <div><dt>مناسب برای</dt><dd>{t.recommended_for.join('، ')}</dd></div>
          <div><dt>راهنما</dt><dd>{t.guide_name}</dd></div>
          <div><dt>وضعیت ثبت‌نام</dt><dd>{booking}</dd></div>
        </dl>
      </section>
      <section className="dc-block"><h3>شامل</h3><ul className="dc-list">{t.included_items.map((x) => <li key={x}>{x}</li>)}</ul></section>
      <section className="dc-block"><h3>شامل نمی‌شود</h3><ul className="dc-list">{t.excluded_items.map((x) => <li key={x}>{x}</li>)}</ul></section>

      <div className="dc-actions">
        <button type="button" className={`tp-btn${fav ? ' primary' : ''}`} aria-pressed={fav} onClick={() => toggleFavorite('tour', t.id)}>{fav ? '♥ در علاقه‌مندی‌ها' : '♡ افزودن به علاقه‌مندی‌ها'}</button>
        <button type="button" className="tp-btn" onClick={onClose}>بستن</button>
      </div>
    </article>
  )
}
