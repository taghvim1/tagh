import type { ReactNode } from 'react'

// آیکون‌های خطی شاخص‌های آب‌وهوا (هم‌سبک آیکون‌های وضعیت هوا): آبی، و زرد برای خورشید/گرما
export type GlyphName = 'humidity' | 'wind' | 'rain-prob' | 'pressure' | 'eye' | 'thermo' | 'thermo-up' | 'thermo-down' | 'cloud' | 'aqi' | 'uv' | 'rain-cloud' | 'sunrise' | 'sunset' | 'pin' | 'refresh' | 'close' | 'arrow'
const G: Record<GlyphName, ReactNode> = {
  humidity: <><path className="b" d="M12 3.5c3.2 4 5.8 7 5.8 10.2a5.8 5.8 0 0 1-11.6 0C6.2 10.5 8.8 7.5 12 3.5z" /><path className="b" d="M9.8 15.5l4.4-4.4M10 11.3v.1M14 15.3v.1" /></>,
  wind: <><path className="b" d="M3 9h10.5a2.5 2.5 0 1 0-2.4-3.2M3 13h15a2.6 2.6 0 1 1-2.5 3.3M3 17h6" /></>,
  'rain-prob': <><path className="b" d="M8 3.5c2 2.5 3.6 4.4 3.6 6.3a3.6 3.6 0 0 1-7.2 0C4.4 7.9 6 6 8 3.5z" /><path className="b" d="M20 10l-6 10M14.5 11.5v.1M19.5 18.5v.1" /></>,
  pressure: <><circle className="b" cx="12" cy="12" r="8.5" /><path className="b" d="M8.5 15.5L15 9M12 3.5v1.5M3.5 12H5M19 12h1.5" /></>,
  eye: <><path className="b" d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle className="b" cx="12" cy="12" r="3" /></>,
  thermo: <><path className="b" d="M10 14.2V5a2 2 0 1 1 4 0v9.2a4 4 0 1 1-4 0z" /><path className="b" d="M12 9v7" /></>,
  'thermo-up': <><path className="a" d="M8 15V5a2 2 0 1 1 4 0v10a4 4 0 1 1-4 0z" /><path className="a" d="M17 9V3M14.5 5.5L17 3l2.5 2.5" /></>,
  'thermo-down': <><path className="b" d="M8 15V5a2 2 0 1 1 4 0v10a4 4 0 1 1-4 0z" /><path className="b" d="M17 3v6M14.5 6.5L17 9l2.5-2.5" /></>,
  cloud: <path className="b" d="M7 18.5h10.5a4.2 4.2 0 0 0 .5-8.4 6 6 0 0 0-11.5 1.6A3.5 3.5 0 0 0 7 18.5z" />,
  aqi: <><path className="b" d="M5 19c0-8 5-13 14-14 0 8-4 14-12 14.5" /><path className="b" d="M5 19c3-5 6-8 10-10" /></>,
  uv: <><circle className="a" cx="12" cy="12" r="4" /><path className="a" d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8M12 10.2v3.6M10.2 12h3.6" /></>,
  'rain-cloud': <><path className="b" d="M7 14.5h10.5a4.2 4.2 0 0 0 .5-8.4 6 6 0 0 0-11.5 1.6A3.5 3.5 0 0 0 7 14.5z" /><path className="b" d="M9 17.5v2M12 17.5v3M15 17.5v2" /></>,
  sunrise: <><path className="a" d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v7M9 7l3-3 3 3M4.5 12.5l1.5 1M19.5 12.5l-1.5 1" /></>,
  sunset: <><path className="a" d="M3 19h18M7 19a5 5 0 0 1 10 0M12 11V4M9 8l3 3 3-3M4.5 12.5l1.5 1M19.5 12.5l-1.5 1" /></>,
  pin: <><path className="b" d="M12 21s6.5-5.7 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.3 6.5 11 6.5 11z" /><circle className="b" cx="12" cy="10" r="2.4" /></>,
  refresh: <><path className="b" d="M20 11a8 8 0 0 0-14-4.5L4 9M4 13a8 8 0 0 0 14 4.5l2-2.5M4 4v5h5M20 20v-5h-5" /></>,
  close: <path className="b" d="M6 6l12 12M18 6L6 18" />,
  arrow: <path className="b" d="M12 20V5M6.5 10.5L12 5l5.5 5.5" />,
}
export default function Glyph({ name, size = 22 }: { name: GlyphName; size?: number }) {
  return <svg className="wp-glyph" viewBox="0 0 24 24" width={size} height={size} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{G[name]}</svg>
}
