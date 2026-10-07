import { type Destination, type Season } from '../data/destinations'
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
          <span className="dest-province">{d.country}</span>
        </span>
        <dl className="dest-meta">
          <div><dt>نوع سفر</dt><dd>{d.type.slice(0, 2).join('، ')}</dd></div>
          <div><dt>مدت پیشنهادی</dt><dd>{d.duration}</dd></div>
          <div><dt>بودجه</dt><dd>{d.budget}</dd></div>
          <div><dt>میانگین دما</dt><dd>{d.average_temperature}</dd></div>
        </dl>
        <span className="dest-reason">{reasonFor(d, season)}</span>
      </span>
    </Link>
  )
}
