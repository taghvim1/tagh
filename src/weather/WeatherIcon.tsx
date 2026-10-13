import type { ReactNode } from 'react'
import type { WeatherIconName } from './codes'

// آیکون‌های خطی دورنگ آب‌وهوا (SVG داخل برنامه، بدون دریافت از اینترنت): خورشید و بخش‌های گرم زرد، ابر/باران/ماه آبی. رنگ‌ها از --wx-amber و --wx-blue می‌آید و با تم عوض می‌شود.
const CLOUD = 'M13 33h20.4a7.4 7.4 0 0 0 .9-14.7 11 11 0 0 0-21 2.6A6.1 6.1 0 0 0 13 33z'
const SMALL_CLOUD = 'M12 30h13.5a5.6 5.6 0 0 0 .6-11.2 8.2 8.2 0 0 0-15.6 2A4.7 4.7 0 0 0 12 30z'
const ray = (cx: number, cy: number, r1: number, r2: number, deg: number) => {
  const a = (deg * Math.PI) / 180, f = (n: number) => Math.round(n * 10) / 10
  return `M${f(cx + r1 * Math.cos(a))} ${f(cy + r1 * Math.sin(a))}L${f(cx + r2 * Math.cos(a))} ${f(cy + r2 * Math.sin(a))}`
}
const rays = (cx: number, cy: number, r1: number, r2: number, degs: number[]) => degs.map((d) => ray(cx, cy, r1, r2, d)).join('')
const ALL = [0, 45, 90, 135, 180, 225, 270, 315]
const Cloud = ({ d = CLOUD, c = 'b' }: { d?: string; c?: 'a' | 'b' }) => <path className={c} d={d} />
const Lines = ({ d }: { d: string }) => <path className="b" d={d} />
const BOLT = 'M25 29l-5 8h6l-3 7'

const ART: Record<WeatherIconName, ReactNode> = {
  sun: <><circle className="a" cx="24" cy="24" r="7.5" /><path className="a" d={rays(24, 24, 12, 16.5, ALL)} /></>,
  clouds: <><path className="a" d="M33 20.5a8 8 0 0 0-13.6-5.6" /><path className="a" d={rays(31, 14, 11.5, 15, [-90, -45, 0])} /><Cloud c="a" d="M11 38h18.5a6.8 6.8 0 0 0 .8-13.5 10 10 0 0 0-19 2.4A5.6 5.6 0 0 0 11 38z" /></>,
  'moon-stars': <><path className="b" d="M29 8.5a15.5 15.5 0 1 0 11 24.6A12.5 12.5 0 0 1 29 8.5z" /><path className="a" d="M36 10v6M33 13h6" /></>,
  'moon-cloud': <><path className="b" d="M31 8a10.5 10.5 0 1 0 9 16.5A8.5 8.5 0 0 1 31 8z" /><Cloud d="M11 38h18.5a6.8 6.8 0 0 0 .8-13.5 10 10 0 0 0-19 2.4A5.6 5.6 0 0 0 11 38z" /></>,
  fog: <><Cloud d={SMALL_CLOUD} /><Lines d="M10 35h28M14 40h22M18 45h14" /></>,
  drizzle: <><Cloud /><Lines d="M17 38v1.5M24 40v1.5M31 38v1.5M20.5 44v1.5M27.5 44v1.5" /></>,
  rain: <><Cloud /><Lines d="M17 37l-2 5M24 37l-2 5M31 37l-2 5" /></>,
  showers: <><Cloud /><Lines d="M15 37l-2.5 7M21 37l-2.5 7M27 37l-2.5 7M33 37l-2.5 7" /></>,
  snow: <><Cloud /><Lines d="M17 39.5v.1M24 39.5v.1M31 39.5v.1M20.5 44.5v.1M27.5 44.5v.1" /></>,
  snowflakes: <><Cloud /><Lines d="M17 36v7M13.9 37.8l6.2 3.4M13.9 41.2l6.2-3.4M31 36v7M27.9 37.8l6.2 3.4M27.9 41.2l6.2-3.4" /></>,
  thunder: <><Cloud /><path className="a" d={BOLT} /></>,
  'thunder-rain': <><Cloud /><path className="a" d={BOLT} /><Lines d="M15 37l-2 5M35 37l-2 5" /></>,
}

export default function WeatherIcon({ name }: { name: WeatherIconName }) {
  return (
    <span className="wx-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false">{ART[name]}</svg>
    </span>
  )
}
