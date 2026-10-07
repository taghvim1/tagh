import type { Destination } from '../data/destinations'

// کارت ساده: فقط تصویر و نام؛ کلیک پنجرهٔ جزئیات را باز می‌کند
export default function DestinationCard({ destination: d, onOpen }: { destination: Destination; onOpen: (d: Destination) => void }) {
  return (
    <button type="button" className="dest-card" onClick={() => onOpen(d)} aria-haspopup="dialog">
      <img className="dest-img" src={d.image} alt="" loading="lazy" />
      <span className="dest-name">{d.name}</span>
    </button>
  )
}
