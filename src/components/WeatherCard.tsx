import { useEffect } from 'react'
import { formatClock, useNow } from '../lib/clock'
import { faNum } from '../lib/jalali'
import { weatherIconName, weatherCodeText } from '../weather/codes'
import { weatherStore, useCurrentWeather } from '../weather/current/store'
import type { CurrentWeatherError } from '../weather/current/types'
import WeatherIcon from '../weather/WeatherIcon'

const ERROR_TEXT: Record<CurrentWeatherError, string> = {
  unsupported: 'موقعیت پشتیبانی نمی‌شود.',
  denied: 'دسترسی به موقعیت داده نشد.',
  unavailable: 'موقعیت در دسترس نیست.',
  timeout: 'دریافت موقعیت طول کشید.',
  network: 'اینترنت در دسترس نیست.',
  api: 'دریافت آب‌وهوا ناموفق بود.',
}

const deg = (n: number | null) => (n === null ? null : `${faNum(Math.round(n))}°`)

// کارت آب‌وهوا کنار تاریخ: آیکون، دمای فعلی، ساعت و بیشینه/کمینهٔ امروز. نام شهر نمایش داده نمی‌شود.
// ساعت از زمان دستگاه می‌آید و به اینترنت وابسته نیست.
export default function WeatherCard() {
  const s = useCurrentWeather()
  const now = useNow()
  useEffect(() => weatherStore.start(), [])
  const clock = <bdi className="wx-clock">{formatClock(now)}</bdi>

  if (s.status === 'idle') {
    return <div className="wx">{clock}<button type="button" className="wx-btn" onClick={() => void weatherStore.request()}>آب‌وهوای من</button></div>
  }
  if (!s.weather) {
    const busy = s.status === 'locating' || s.status === 'loading'
    return (
      <div className="wx" role="status">
        {clock}
        {busy ? <span className="wx-note">در حال دریافت…</span> : (
          <>
            <span className="wx-note">{s.error ? ERROR_TEXT[s.error] : 'آب‌وهوا در دسترس نیست.'}</span>
            <button type="button" className="wx-btn" onClick={() => void weatherStore.retry()}>تلاش مجدد</button>
          </>
        )}
      </div>
    )
  }

  const w = s.weather
  const icon = weatherIconName(w.weatherCode, w.isDay)
  const hi = deg(w.tempMax), lo = deg(w.tempMin)
  const updated = s.updatedAt ? formatClock(new Date(s.updatedAt)) : null
  return (
    <div className="wx" aria-label={`آب‌وهوا: ${weatherCodeText(w.weatherCode) ?? 'وضعیت نامشخص'}`}>
      {icon && <WeatherIcon name={icon} />}
      <strong className="wx-temp">{deg(w.temperature) ?? '—'}</strong>
      <span className="wx-meta">
        {clock}
        {(hi || lo) && (
          <span className="wx-range">
            {hi && <span aria-label={`بیشینه ${hi}`}>↑{hi}</span>}
            {lo && <span aria-label={`کمینه ${lo}`}>↓{lo}</span>}
          </span>
        )}
      </span>
      {s.error && <button type="button" className="wx-stale" title={ERROR_TEXT[s.error]} aria-label={`${ERROR_TEXT[s.error]} آخرین به‌روزرسانی ${updated}. تلاش مجدد`} onClick={() => void weatherStore.retry()}>{updated} ⟳</button>}
    </div>
  )
}
