import type { Tour } from './types'

// کارت ساده مثل کارت مقصد: فقط تصویر و نام؛ لمس آن پنجرهٔ جزئیات را باز می‌کند
export default function TourCard({ tour: t, onOpen }: { tour: Tour; onOpen: (t: Tour) => void }) {
  return (
    <button type="button" className="dest-card" onClick={() => onOpen(t)} aria-haspopup="dialog">
      <img className="dest-img" src={t.image} alt="" loading="lazy" />
      <span className="dest-name">{t.title}</span>
    </button>
  )
}
