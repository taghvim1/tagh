import { LEVEL_LABEL, RATING_LABEL, locationLabel, type Destination, type Season } from '../data/destinations'
import { toggleFavorite, useFavorites } from '../lib/favorites'
import { faNum } from '../lib/jalali'
import { seasonKey } from '../travel/season'
import { weatherCodeText } from '../weather/codes'
import { useHistoricalClimate } from '../weather/history/store'

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
  const real = useHistoricalClimate()[d.id]?.stats.seasons[seasonKey(season)]
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

      {real && real.tempMean !== null && (
        <section className="dc-block">
          <h3>آمار واقعی ۵ سال اخیر <span className="dc-season">({season})</span></h3>
          <dl className="dc-grid">
            <div><dt>میانگین دما</dt><dd>{deg(Math.round(real.tempMean))}</dd></div>
            {real.tempMin !== null && real.tempMax !== null && <div><dt>میانگین کمینه تا بیشینه</dt><dd>{faNum(Math.round(real.tempMin))} تا {faNum(Math.round(real.tempMax))} درجه</dd></div>}
            {real.precipitationMm !== null && <div><dt>بارش فصل</dt><dd>{faNum(Math.round(real.precipitationMm))} میلی‌متر</dd></div>}
            {real.rainyDays !== null && <div><dt>روزهای بارانی</dt><dd>{faNum(Math.round(real.rainyDays))} روز</dd></div>}
            {weatherCodeText(real.dominantCode) && <div><dt>وضعیت غالب</dt><dd>{weatherCodeText(real.dominantCode)}</dd></div>}
          </dl>
          <p className="dc-note">میانگین داده‌های ثبت‌شدهٔ گذشته است، نه پیش‌بینی. روز بارانی = بارش حداقل ۱ میلی‌متر.</p>
        </section>
      )}

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
