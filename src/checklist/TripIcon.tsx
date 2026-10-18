import type { IconKey } from './templates'

// آیکون‌های خطیِ مینیمال (۲۴×۲۴)
const PATHS: Record<IconKey, string> = {
  adventure: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  luxury: 'M6 4h12l3 5-9 11L3 9l3-5ZM3 9h18M9 4l3 5 3-5M12 9v11',
  offroad: 'M4 16v-4l2-4h12l2 4v4M4 16h16M4 16v2h3v-2M17 16v2h3v-2M6 12h12M8.5 14.2h.01M15.5 14.2h.01',
  motorcycle: 'M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5.5 15l4-6h4l2.5 4.5M13.5 9l1.5-3h2.5M9.5 9H7',
  camping: 'M3 19 12 5l9 14H3ZM12 5v14M9 19l3-5 3 5',
  hiking: 'M3 19l6-10 4 6 2-3 6 7H3ZM9 9l1.8 3',
  sea: 'M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 4v7M8.5 8 12 4l3.5 4',
  snow: 'M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5',
  family: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 1 0 0-5M17 15c2.5 0 4.5 1.5 4.5 4',
  business: 'M4 8h16v11H4V8ZM9 8V5h6v3M4 13h16',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z',
}
export default function TripIcon({ name, size = 34 }: { name: IconKey; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
}
