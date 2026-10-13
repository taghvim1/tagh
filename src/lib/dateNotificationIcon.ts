import type { NotifWeather } from './dateNotificationData'
import clouds from '../weather/icons/clouds.svg?raw'
import drizzle from '../weather/icons/drizzle.svg?raw'
import fog from '../weather/icons/fog.svg?raw'
import moonCloud from '../weather/icons/moon-cloud.svg?raw'
import moonStars from '../weather/icons/moon-stars.svg?raw'
import rain from '../weather/icons/rain.svg?raw'
import showers from '../weather/icons/showers.svg?raw'
import snow from '../weather/icons/snow.svg?raw'
import snowflakes from '../weather/icons/snowflakes.svg?raw'
import sun from '../weather/icons/sun.svg?raw'
import thunder from '../weather/icons/thunder.svg?raw'
import thunderRain from '../weather/icons/thunder-rain.svg?raw'
import type { WeatherIconName } from '../weather/codes'

const SVG: Record<WeatherIconName, string> = { sun, clouds, fog, rain, drizzle, showers, snow, snowflakes, thunder, 'moon-cloud': moonCloud, 'moon-stars': moonStars, 'thunder-rain': thunderRain }
const SIZE = 192

/** تصویر آیکون بزرگ اعلان: فقط وکتور آب‌وهوا + عدد میانگین دما، سفید روی زمینهٔ سبزآبی (PNG به‌صورت data URL) */
export async function renderWeatherIcon(n: NotifWeather): Promise<string | null> {
  try {
    const svg = SVG[n.icon].replace(/currentColor/g, '#ffffff').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="404" height="404" ')
    const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    await img.decode()
    const c = document.createElement('canvas'); c.width = c.height = SIZE
    const g = c.getContext('2d'); if (!g) return null
    g.fillStyle = '#0e7c86'; g.beginPath(); g.roundRect(0, 0, SIZE, SIZE, 36); g.fill()
    g.drawImage(img, 36, 14, 120, 120)
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'bold 54px sans-serif'
    g.fillText(`${n.avg < 0 ? '−' : ''}${Math.abs(n.avg).toLocaleString('fa-IR', { useGrouping: false })}°`, SIZE / 2, 176)
    return c.toDataURL('image/png')
  } catch { return null }
}
