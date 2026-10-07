import { LEVEL_LABEL, RATING_LABEL, locationLabel, type Destination, type Season } from '../data/destinations'
import { toggleFavorite, useFavorites } from '../lib/favorites'
import { faNum } from '../lib/jalali'
import { seasonKey } from '../travel/season'

interface Props {
  destination: Destination
  season: Season
  onClose?: () => void
}

const deg = (n: number) => `${faNum(n)} درجه`

// محتوای جزئیات مقصد (هم در پنجرهٔ مرکزی و هم در صفحهٔ جزئیات)
export default function DestinationContent({ destination: d, season, onClose }: Props) {
  const favs = useFavorites()
  const fav = favs.destination.includes(d.id)
  const c = d.season_suitability[seasonKey(season)]
  return (
    <article className="dc">
      <img className="dc-hero" src={d.image} alt={d.name} />
      <header className="dc-head">
        <h2>{d.name}</h2>
        <p className="dc-loc">{locationLabel(d)}</p>
      </header>
      <p className="dc-desc">{d.description}</p>

      <section className="dc-block">
        <h3>آب‌وهوای این فصل <span className="dc-season">({season})</span></h3>
        <p className="dc-season-desc">{c.description}</p>
        <dl className="dc-grid">
          <div><dt>میانگین دما</dt><dd>{deg(c.average_temperature)}</dd></div>
          <div><dt>محدودهٔ دما</dt><dd>{faNum(c.temperature_min)} تا {faNum(c.temperature_max)} درجه</dd></div>
          <div><dt>وضعیت هوا</dt><dd>{c.weather_condition}</dd></div>
          <div><dt>بارندگی</dt><dd>{LEVEL_LABEL[c.rainfall]}</dd></div>
          <div><dt>تناسب با فصل</dt><dd><span className={`dc-badge ${c.rating}`}>{RATING_LABEL[c.rating]}</span></dd></div>
        </dl>
      </section>

      <section className="dc-block">
        <h3>اطلاعات سفر</h3>
        <dl className="dc-grid">
          <div><dt>بهترین زمان</dt><dd>{d.best_seasons.join('، ') || '—'}</dd></div>
          <div><dt>مدت پیشنهادی</dt><dd>{d.duration}</dd></div>
          <div><dt>بودجه</dt><dd>سطح {d.budget}</dd></div>
          <div><dt>نوع مقصد</dt><dd>{d.type.join('، ')}</dd></div>
          <div><dt>مناسب برای</dt><dd>{d.recommended_for.join('، ')}</dd></div>
          {d.visa_required !== null && <div><dt>ویزا</dt><dd>{d.visa_required ? 'نیازمند ویزا' : 'بدون نیاز به ویزا'}</dd></div>}
        </dl>
        {d.visa_required !== null && <p className="dc-note">وضعیت ویزا برای شهروندان ایران و نمونه است؛ پیش از سفر از منبع رسمی بررسی کنید.</p>}
      </section>

      <section className="dc-block">
        <h3>جاذبه‌های اصلی</h3>
        <ul className="dc-list">{d.attractions.map((a) => <li key={a}>{a}</li>)}</ul>
      </section>

      <div className="dc-actions">
        <button type="button" className={`tp-btn${fav ? ' primary' : ''}`} aria-pressed={fav} onClick={() => toggleFavorite('destination', d.id)}>{fav ? '♥ در علاقه‌مندی‌ها' : '♡ افزودن به علاقه‌مندی‌ها'}</button>
        {onClose && <button type="button" className="tp-btn" onClick={onClose}>بستن</button>}
      </div>
    </article>
  )
}
