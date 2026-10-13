import { useEffect, useState } from 'react'
import AppChrome from '../components/AppChrome'
import { formatClock } from '../lib/clock'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { weatherCodeText, weatherIconName } from '../weather/codes'
import { clockOf, dayLabel, degree, hourLabel, km, num, uvLabel, windFrom } from '../weather/format'
import { useCurrentWeather, weatherStore } from '../weather/current/store'
import type { CurrentWeather, DailyForecast, HourlyForecast } from '../weather/current/types'
import WeatherIcon from '../weather/WeatherIcon'

type Tab = 'hourly' | 'daily'
const Icon = ({ code, day }: { code: number | null; day: boolean | null }) => { const n = weatherIconName(code, day); return n ? <WeatherIcon name={n} /> : <span className="wp-noicon" aria-hidden="true" /> }

function Wind({ speed, gust, dir }: { speed: number | null; gust?: number | null; dir?: number | null }) {
  if (speed == null) return null
  const from = windFrom(dir)
  return (
    <span className="wp-chip" title="باد">
      {dir != null && <span className="wp-arrow" style={{ transform: `rotate(${dir + 180}deg)` }} aria-hidden="true">↑</span>}
      باد {num(speed)} کیلومتر/ساعت{from ? ` از ${from}` : ''}{gust != null && gust > speed ? ` (تندباد ${num(gust)})` : ''}
    </span>
  )
}

function HourRow({ h, first }: { h: HourlyForecast; first: boolean }) {
  const text = weatherCodeText(h.weatherCode)
  return (
    <li className="wp-hour">
      {first && <h3 className="wp-daysep">{dayLabel(h.time)}</h3>}
      <div className="wp-row">
        <span className="wp-time">{hourLabel(h.time)}</span>
        <Icon code={h.weatherCode} day={h.isDay} />
        <strong className="wp-t">{degree(h.temperature)}</strong>
        <span className="wp-desc">{text ?? ''}</span>
      </div>
      <div className="wp-chips">
        {h.apparent != null && <span className="wp-chip">حس‌شده {degree(h.apparent)}</span>}
        {h.precipitationProbability != null && <span className="wp-chip">احتمال بارش {num(h.precipitationProbability)}٪</span>}
        {h.precipitation != null && h.precipitation > 0 && <span className="wp-chip">بارش {num(h.precipitation, 1)} میلی‌متر</span>}
        <Wind speed={h.windSpeed} gust={h.windGusts} dir={h.windDirection} />
        {h.humidity != null && <span className="wp-chip">رطوبت {num(h.humidity)}٪</span>}
        {h.cloudCover != null && <span className="wp-chip">ابر {num(h.cloudCover)}٪</span>}
        {h.uv != null && h.isDay !== false && h.uv > 0 && <span className="wp-chip">فرابنفش {num(h.uv, 1)} ({uvLabel(h.uv)})</span>}
        {km(h.visibility) && <span className="wp-chip">دید {km(h.visibility)}</span>}
      </div>
    </li>
  )
}

function DayRow({ d, today }: { d: DailyForecast; today: boolean }) {
  const text = weatherCodeText(d.weatherCode)
  return (
    <li className="wp-day">
      <div className="wp-row">
        <span className="wp-dayname">{today ? 'امروز' : dayLabel(d.date)}</span>
        <Icon code={d.weatherCode} day />
        <strong className="wp-t">{degree(d.tempMax)}<span className="wp-lo"> / {degree(d.tempMin)}</span></strong>
        <span className="wp-desc">{text ?? ''}</span>
      </div>
      <div className="wp-chips">
        {d.precipitationProbability != null && <span className="wp-chip">احتمال بارش {num(d.precipitationProbability)}٪</span>}
        {d.precipitationSum != null && d.precipitationSum > 0 && <span className="wp-chip">مجموع بارش {num(d.precipitationSum, 1)} میلی‌متر</span>}
        <Wind speed={d.windMax} gust={d.gustMax} />
        {d.apparentMax != null && d.apparentMin != null && <span className="wp-chip">حس‌شده {degree(d.apparentMax)} تا {degree(d.apparentMin)}</span>}
        {d.uvMax != null && <span className="wp-chip">فرابنفش {num(d.uvMax, 1)} ({uvLabel(d.uvMax)})</span>}
        {clockOf(d.sunrise) && <span className="wp-chip">طلوع {clockOf(d.sunrise)}</span>}
        {clockOf(d.sunset) && <span className="wp-chip">غروب {clockOf(d.sunset)}</span>}
      </div>
    </li>
  )
}

function Now({ w, updatedAt }: { w: CurrentWeather; updatedAt: number | null }) {
  return (
    <section className="wp-now" aria-label="هوای اکنون">
      <Icon code={w.weatherCode} day={w.isDay} />
      <div className="wp-now-main">
        <strong className="wp-now-t">{degree(w.temperature)}</strong>
        <span>{weatherCodeText(w.weatherCode) ?? ''}</span>
        <span className="wp-muted">بیشینه {degree(w.tempMax)}، کمینه {degree(w.tempMin)}</span>
      </div>
      <div className="wp-chips wp-now-chips">
        {w.apparentTemperature != null && <span className="wp-chip">حس‌شده {degree(w.apparentTemperature)}</span>}
        {w.humidity != null && <span className="wp-chip">رطوبت {num(w.humidity)}٪</span>}
        <Wind speed={w.windSpeed} gust={w.windGusts} dir={w.windDirection} />
        {w.precipitation != null && <span className="wp-chip">بارش اکنون {num(w.precipitation, 1)} میلی‌متر</span>}
        {w.cloudCover != null && <span className="wp-chip">ابر {num(w.cloudCover)}٪</span>}
        {w.pressure != null && <span className="wp-chip">فشار {num(w.pressure)} هکتوپاسکال</span>}
      </div>
      {updatedAt && <span className="wp-muted wp-upd">آخرین به‌روزرسانی {formatClock(new Date(updatedAt))}</span>}
    </section>
  )
}

// صفحهٔ جزئیات آب‌وهوا (با زدن کارت آب‌وهوا): یک سمت پیش‌بینی ساعتی با جزئیات، سمت دیگر ده روز آینده. در صفحهٔ باریک دو زبانه، در صفحهٔ عریض کنار هم.
export default function WeatherPage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const s = useCurrentWeather()
  const [tab, setTab] = useState<Tab>('hourly')
  useEffect(() => weatherStore.start(), [])
  // دادهٔ ذخیره‌شدهٔ قدیمی (بدون پیش‌بینی ده‌روزه) یک‌بار تازه می‌شود
  useEffect(() => { const w = weatherStore.getState().weather; if (w && !w.daily?.length) void weatherStore.retry() }, [])

  const w = s.weather
  const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const hourly = (w?.hourly ?? []).filter((h) => h.time.slice(0, 13) >= `${todayIso}T${String(new Date().getHours()).padStart(2, '0')}`).slice(0, 48)
  const daily = (w?.daily ?? []).filter((d) => d.date >= todayIso)

  return (
    <div className="tp-page wp" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="آب‌وهوا" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head"><h1>آب‌وهوا</h1></header>
        {!w ? (
          <p className="wp-empty" role="status">
            {s.status === 'locating' || s.status === 'loading' ? 'در حال دریافت…' : 'هنوز آب‌وهوایی دریافت نشده است.'}
            {s.status !== 'locating' && s.status !== 'loading' && <> <button type="button" className="wx-btn" onClick={() => void (s.status === 'idle' ? weatherStore.request() : weatherStore.retry())}>{s.status === 'idle' ? 'آب‌وهوای من' : 'تلاش مجدد'}</button></>}
          </p>
        ) : (
          <>
            <Now w={w} updatedAt={s.updatedAt} />
            {s.error && <p className="wp-warn" role="alert">به‌روزرسانی ناموفق بود؛ آخرین داده نمایش داده می‌شود. <button type="button" className="wx-btn" onClick={() => void weatherStore.retry()}>تلاش مجدد</button></p>}
            <div className="wp-tabs" role="tablist" aria-label="نوع پیش‌بینی">
              <button type="button" role="tab" id="wp-tab-hourly" aria-selected={tab === 'hourly'} aria-controls="wp-hourly" onClick={() => setTab('hourly')}>ساعتی</button>
              <button type="button" role="tab" id="wp-tab-daily" aria-selected={tab === 'daily'} aria-controls="wp-daily" onClick={() => setTab('daily')}>ده روز آینده</button>
            </div>
            <div className="wp-cols">
              <section id="wp-hourly" role="tabpanel" aria-labelledby="wp-tab-hourly" className={`wp-panel${tab === 'hourly' ? ' on' : ''}`}>
                <h2>پیش‌بینی ساعتی (۴۸ ساعت آینده)</h2>
                {hourly.length ? (
                  <ul className="wp-list">{hourly.map((h, i) => <HourRow key={h.time} h={h} first={i === 0 || h.time.slice(0, 10) !== hourly[i - 1].time.slice(0, 10)} />)}</ul>
                ) : <p className="wp-empty">پیش‌بینی ساعتی در دسترس نیست.</p>}
              </section>
              <section id="wp-daily" role="tabpanel" aria-labelledby="wp-tab-daily" className={`wp-panel${tab === 'daily' ? ' on' : ''}`}>
                <h2>ده روز آینده</h2>
                {daily.length ? (
                  <ul className="wp-list">{daily.map((d) => <DayRow key={d.date} d={d} today={d.date === todayIso} />)}</ul>
                ) : <p className="wp-empty">پیش‌بینی ده‌روزه در دسترس نیست.</p>}
              </section>
            </div>
            <p className="wp-muted wp-src">منبع داده: Open-Meteo</p>
          </>
        )}
      </main>
    </div>
  )
}
