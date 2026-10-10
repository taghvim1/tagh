import { toggleFavorite, useFavorites, type FavoriteKind } from '../lib/favorites'

// دکمهٔ علاقه‌مندی روی تصویر (قلب + «علاقه‌مند»)؛ داخل .dc-float می‌نشیند تا با اسکرول جابه‌جا نشود
export default function FavButton({ kind, id }: { kind: FavoriteKind; id: number }) {
  const on = useFavorites()[kind].includes(id)
  return (
    <div className="dc-float">
      <button type="button" className={`fav-btn${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleFavorite(kind, id)}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
        </svg>
        <span>علاقه‌مند</span>
      </button>
    </div>
  )
}
