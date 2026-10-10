import type { WeatherIconName } from './codes'
import clouds from './icons/clouds.svg?raw'
import drizzle from './icons/drizzle.svg?raw'
import fog from './icons/fog.svg?raw'
import moonCloud from './icons/moon-cloud.svg?raw'
import moonStars from './icons/moon-stars.svg?raw'
import rain from './icons/rain.svg?raw'
import showers from './icons/showers.svg?raw'
import snow from './icons/snow.svg?raw'
import snowflakes from './icons/snowflakes.svg?raw'
import sun from './icons/sun.svg?raw'
import thunder from './icons/thunder.svg?raw'
import thunderRain from './icons/thunder-rain.svg?raw'

// آیکون‌های خطی آب‌وهوا (SVG داخل برنامه، بدون دریافت از اینترنت)؛ رنگ از currentColor می‌آید و با تم تاریک/روشن عوض می‌شود.
const ICONS: Record<WeatherIconName, string> = {
  sun, clouds, fog, rain, drizzle, showers, snow, snowflakes, thunder,
  'moon-cloud': moonCloud, 'moon-stars': moonStars, 'thunder-rain': thunderRain,
}

export default function WeatherIcon({ name }: { name: WeatherIconName }) {
  return <span className="wx-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
}
