import type { Season } from '../data/destinations'
import { SEASONS, type SeasonInfo } from '../travel/season'

// آیکون‌های وکتور سبک و اختصاصی هر فصل
const common = { viewBox: '0 0 24 24', width: 40, height: 40, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

function SeasonIcon({ id }: { id: SeasonInfo['id'] }) {
  switch (id) {
    case 'spring': // شکوفه
      return (
        <svg {...common}>
          {[[12, 6.8], [16.9, 10.4], [15.1, 16.2], [8.9, 16.2], [7.1, 10.4]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={3} />)}
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      )
    case 'summer': // خورشید
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </svg>
      )
    case 'autumn': // برگ
      return (
        <svg {...common}>
          <path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z" />
          <path d="M5 19 14 10" />
        </svg>
      )
    default: // برف‌دانه
      return (
        <svg {...common}>
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" />
        </svg>
      )
  }
}

interface Props {
  value: Season
  onChange: (season: Season) => void
}

export default function SeasonPicker({ value, onChange }: Props) {
  return (
    <div className="season-grid" role="radiogroup" aria-label="فصل سفر">
      {SEASONS.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={s.title === value} className={`season-btn ${s.id}${s.title === value ? ' on' : ''}`} onClick={() => onChange(s.title)}>
          <SeasonIcon id={s.id} />
          <span>{s.title}</span>
        </button>
      ))}
    </div>
  )
}
