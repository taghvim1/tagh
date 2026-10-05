import { locationLabel, type Destination, type Season } from '../data/destinations'
import { Link } from '../lib/router'
import { reasonFor } from '../travel/recommend'

interface Props {
  destination: Destination
  season: Season
}

// کارت مقصد؛ با کلیک صفحهٔ جزئیات همان مقصد باز می‌شود
export default function DestinationCard({ destination: d, season }: Props) {
  return (
    <Link to={`/travel-suggestions/destination/${d.id}`} className="dest-card">
      <img className="dest-img" src={d.image} alt={d.name} loading="lazy" />
      <span className="dest-body">
        <span className="dest-head">
          <strong className="dest-name">{d.name}</strong>
          <span className="dest-province">{locationLabel(d)}</span>
        </span>
        <dl className="dest-meta">
          <div><dt>نوع سفر</dt><dd>{d.type}</dd></div>
          <div><dt>مدت پیشنهادی</dt><dd>{d.duration}</dd></div>
          <div><dt>بودجه</dt><dd>{d.budget}</dd></div>
          <div><dt>فصل مناسب</dt><dd>{d.best_seasons.join('، ')}</dd></div>
        </dl>
        <span className="dest-reason">{reasonFor(d, season)}</span>
      </span>
    </Link>
  )
}
