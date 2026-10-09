import { useEffect } from 'react'
import { formatClock, useNow } from '../lib/clock'
import { MONTHS, WEEKDAYS, faNum, fromGregorian, weekdayIndex } from '../lib/jalali'
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

// کارت کوچک آب‌وهوای شهر کاربر در بالای صفحهٔ اصلی. ساعت و تاریخ از زمان دستگاه می‌آیند و به اینترنت وابسته نیستند.
export default function WeatherCard() {
  const s = useCurrentWeather()
  const now = useNow()
  useEffect(() => weatherStore.start(), [])

  const j = fromGregorian(now)
  const when = (
    <span className="wx-when">
      <bdi className="wx-clock">{formatClock(now)}</bdi>
      <span>{WEEKDAYS[weekdayIndex(j)]} {faNum(j.day)} {MONTHS[j.month - 1]}</span>
    </span>
  )

  if (s.status === 'idle') {
    return <div className="wx wx-compact">{when}<button type="button" className="wx-btn" onClick={() => void weatherStore.request()}>آب‌وهوای شهر من</button></div>
  }
  if (!s.weather) {
    const busy = s.status === 'locating' || s.status === 'loading'
    return (
      <div className="wx wx-compact" role="status">
        {when}
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
  const desc = weatherCodeText(w.weatherCode) ?? 'وضعیت نامشخص'
  const lo = deg(w.tempMin), hi = deg(w.tempMax)
  const updated = s.updatedAt ? formatClock(new Date(s.updatedAt)) : null
  return (
    <div className="wx" aria-label="آب‌وهوای فعلی">
      <span className="wx-icon" aria-hidden="true">{weatherCodeIcon(w.weatherCode, w.isDay)}</span>
      <span className="wx-main">
        <span className="wx-row1">
          <strong className="wx-temp">{deg(w.temperature) ?? '—'}</strong>
          <span>{desc}</span>
          <span className="wx-city">{s.city ?? 'موقعیت فعلی شما'}</span>
        </span>
        <span className="wx-row2">
          {lo && hi && <span>{lo} تا {hi}</span>}
          {w.precipitationProbability !== null && <span>بارش {faNum(Math.round(w.precipitationProbability))}٪</span>}
          {w.windSpeed !== null && <span>باد {faNum(Math.round(w.windSpeed))} کم/س</span>}
        </span>
        {s.error && <span className="wx-stale">آخرین به‌روزرسانی {updated} · {ERROR_TEXT[s.error]} <button type="button" className="tp-link" onClick={() => void weatherStore.retry()}>تلاش مجدد</button></span>}
      </span>
      {when}
    </div>
  )
}
