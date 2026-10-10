import { useEffect } from 'react'
import { formatClock, useNow } from '../lib/clock'
import { faNum } from '../lib/jalali'
import { weatherCodeIcon, weatherCodeText } from '../weather/codes'
import { weatherStore, useCurrentWeather } from '../weather/current/store'
import type { CurrentWeatherError } from '../weather/current/types'

const ERROR_TEXT: Record<CurrentWeatherError, string> = {
  unsupported: 'مرورگر از موقعیت مکانی پشتیبانی نمی‌کند.',
  denied: 'دسترسی به موقعیت داده نشد.',
  unavailable: 'موقعیت در دسترس نیست؛ GPS را بررسی کنید.',
  timeout: 'دریافت موقعیت طول کشید.',
  network: 'اینترنت در دسترس نیست.',
  api: 'دریافت آب‌وهوا ناموفق بود.',
}

const deg = (n: number | null) => (n === null ? null : `${faNum(Math.round(n))}°`)

// کارت کوچک آب‌وهوا: نماد، دمای فعلی، ساعت و بیشینه/کمینهٔ امروز. نام شهر نمایش داده نمی‌شود.
// ساعت از زمان دستگاه می‌آید و به اینترنت وابسته نیست.
export default function WeatherCard() {
  const s = useCurrentWeather()
  const now = useNow()
  useEffect(() => weatherStore.start(), [])
  const clock = <bdi className="wx-clock">{formatClock(now)}</bdi>

  if (s.status === 'idle') {
    return <div className="wx wx-compact">{clock}<button type="button" className="wx-btn" onClick={() => void weatherStore.request()}>آب‌وهوای من</button></div>
  }
  if (!s.weather) {
    const busy = s.status === 'locating' || s.status === 'loading'
    return (
      <div className="wx wx-compact" role="status">
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
  const hi = deg(w.tempMax), lo = deg(w.tempMin)
  const updated = s.updatedAt ? formatClock(new Date(s.updatedAt)) : null
  return (
    <div className="wx" aria-label={`آب‌وهوا: ${weatherCodeText(w.weatherCode) ?? 'وضعیت نامشخص'}`}>
      <span className="wx-icon" aria-hidden="true">{weatherCodeIcon(w.weatherCode, w.isDay)}</span>
      <strong className="wx-temp">{deg(w.temperature) ?? '—'}</strong>
      {clock}
      {(hi || lo) && (
        <span className="wx-range">
          {hi && <span aria-label={`بیشینه ${hi}`}>↑ {hi}</span>}
          {lo && <span aria-label={`کمینه ${lo}`}>↓ {lo}</span>}
        </span>
      )}
      {s.error && <span className="wx-stale" title={`${ERROR_TEXT[s.error]}`}>
        <button type="button" className="tp-link" onClick={() => void weatherStore.retry()}>{updated} ⟳</button>
      </span>}
    </div>
  )
}
