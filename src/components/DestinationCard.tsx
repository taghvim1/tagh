import type { Destination } from '../data/destinations'

interface Props {
  destination: Destination
  selected: boolean
  onSelect: () => void
}

// کارت فقط انتخاب می‌شود (بدون صفحهٔ جزئیات، علاقه‌مندی یا رزرو)
export default function DestinationCard({ destination: d, selected, onSelect }: Props) {
  return (
    <button type="button" className={`dest-card${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      <span className="dest-head">
        <strong className="dest-name">{d.name}</strong>
        <span className="dest-province">{d.province}</span>
      </span>
      <dl className="dest-meta">
        <div><dt>نوع سفر</dt><dd>{d.type}</dd></div>
        <div><dt>مدت پیشنهادی</dt><dd>{d.duration}</dd></div>
        <div><dt>سطح بودجه</dt><dd>{d.budget}</dd></div>
        <div><dt>فصل مناسب</dt><dd>{d.best_seasons.join('، ')}</dd></div>
      </dl>
    </button>
  )
}
