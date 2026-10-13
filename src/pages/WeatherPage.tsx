import { useEffect, useMemo, useState } from 'react'
import AppChrome from '../components/AppChrome'
import { formatClock } from '../lib/clock'
import { useEscape } from '../lib/useAnimatedMount'
import { useOverlay } from '../lib/overlay'
import { faNum, MONTHS, WEEKDAYS, fromGregorian } from '../lib/jalali'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { weatherCodeText, weatherIconName } from '../weather/codes'
import { reverseGeocode } from '../weather/current/geocode'
import { useCurrentWeather, weatherStore } from '../weather/current/store'
import type { CurrentWeather, DailyForecast, HourlyForecast } from '../weather/current/types'
import { aqiLabel, clockOf, dayLabel, dayLength, degree, gregorianShort, hourLabel, isWarmIcon, kmValue, num, uvLabel, windFrom } from '../weather/format'
import Glyph, { type GlyphName } from '../weather/Glyph'
import WeatherIcon from '../weather/WeatherIcon'

type Sel = { kind: 'hour'; h: HourlyForecast } | { kind: 'day'; d: DailyForecast; today: boolean }
const iso2 = (n: number) => String(n).padStart(2, '0')
const isoDay = (d = new Date()) => `${d.getFullYear()}-${iso2(d.getMonth() + 1)}-${iso2(d.getDate())}`

function Sky({ code, day, big }: { code: number | null; day: boolean | null; big?: boolean }) {
  const n = weatherIconName(code, day)
  if (!n) return <span className="wp-noicon" aria-hidden="true" />
  return big ? <span className={`wp-disc ${isWarmIcon(n) ? 'warm' : 'cool'}`}><WeatherIcon name={n} /></span> : <WeatherIcon name={n} />
}

interface TileProps { cls: string; glyph: GlyphName; value: string; unit?: string; sub?: React.ReactNode; label: string; bar?: number | null }
function Tile({ cls, glyph, value, unit, sub, label, bar }: TileProps) {
  return (
    <div className={`wp-tile ${cls}`} role="group" aria-label={`${label}: ${value} ${unit ?? ''}`}>
      <Glyph name={glyph} size={24} />
      <strong className="wp-tv">{value}</strong>
      {unit && <span className="wp-tu">{unit}</span>}
      {bar != null && <span className="wp-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} /></span>}
      {sub && <span className="wp-tsub">{sub}</span>}
      <span className="wp-tl">{label}</span>
    </div>
  )
}
const WindSub = ({ dir, gust, speed }: { dir: number | null | undefined; gust: number | null | undefined; speed: number | null }) => {
  const from = windFrom(dir)
  return (
    <>
      {dir != null && <span className="wp-arrow" style={{ transform: `rotate(${dir + 180}deg)` }} aria-hidden="true"><Glyph name="arrow" size={14} /></span>}
      {from && <span> {from}</span>}
      {gust != null && speed != null && gust > speed && <span> · تندباد {num(gust)}</span>}
    </>
  )
}
const aqiTile = (v: number | null | undefined) => v != null && <Tile cls="aqi" glyph="aqi" value={num(v)} unit="AQI" sub={aqiLabel(v)} label="کیفیت هوا" />
const uvTile = (v: number | null | undefined) => v != null && <Tile cls="uv" glyph="uv" value={num(v, v < 10 ? 1 : 0)} unit="UV" sub={uvLabel(v)} label="شاخص فرابنفش" />

function Arc({ sunrise, sunset, now }: { sunrise: string | null; sunset: string | null; now: Date | null }) {
  const mins = (t: string) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16))
  let p = 0.5
  if (sunrise && sunset && now) p = Math.min(1, Math.max(0, (now.getHours() * 60 + now.getMinutes() - mins(sunrise)) / (mins(sunset) - mins(sunrise))))
  const x = 10 + 180 * p, y = 50 - 4 * 46 * p * (1 - p) // سهمی: بیشینهٔ ارتفاع در میانهٔ روز
  return (
    <svg className="wp-arc" viewBox="0 0 200 60" aria-hidden="true">
      <line x1="6" y1="52" x2="194" y2="52" className="base" />
      <path d="M10 50Q100 -42 190 50" className="path" />
      <circle cx={x} cy={y} r="6.5" className="sun" />
    </svg>
  )
}

function Dialog({ sel, onClose, w, now }: { sel: Sel; onClose: () => void; w: CurrentWeather; now: Date }) {
  useEscape(true, onClose)
  const isHour = sel.kind === 'hour'
  const day = sel.kind === 'day' ? sel.d : w.daily?.find((d) => d.date === sel.h.time.slice(0, 10))
  const title = sel.kind === 'day' ? (sel.today ? 'امروز' : dayLabel(sel.d.date)) : `${dayLabel(sel.h.time)}`
  const code = sel.kind === 'day' ? sel.d.weatherCode : sel.h.weatherCode
  const dayFlag = sel.kind === 'day' ? true : sel.h.isDay
  const km = (v: number | null | undefined) => (v == null ? null : num(kmValue(v)!, 0))
  return (
    <div className="wp-dlg-root">
      <button type="button" className="wp-backdrop" aria-label="بستن" tabIndex={-1} onClick={onClose} />
      <section className="wp-dlg" role="dialog" aria-modal="true" aria-label={`جزئیات ${title}`}>
        <header className="wp-dlg-head">
          <h2>{title}</h2>
          <button type="button" className="wp-x" aria-label="بستن" onClick={onClose} autoFocus><Glyph name="close" size={20} /></button>
        </header>
        {sel.kind === 'hour' ? (
          <div className="wp-dlg-hero">
            <span className="wp-clock">{hourLabel(sel.h.time)}</span>
            <div className="wp-dlg-t"><strong>{degree(sel.h.temperature)}</strong><span>{weatherCodeText(sel.h.weatherCode) ?? ''}</span></div>
            <Sky code={code} day={dayFlag} big />
          </div>
        ) : (
          <div className="wp-dlg-hero day">
            <div className="wp-dlg-minmax">
              <span className="wp-gdate">{gregorianShort(sel.d.date)}</span>
              <span className="wp-mm"><Glyph name="thermo-up" size={22} /><strong>{degree(sel.d.tempMax)}</strong></span>
              <span className="wp-mm"><Glyph name="thermo-down" size={22} /><strong>{degree(sel.d.tempMin)}</strong></span>
              <span className="wp-muted">{weatherCodeText(sel.d.weatherCode) ?? ''}</span>
            </div>
            <Sky code={code} day={dayFlag} big />
          </div>
        )}
        <div className={`wp-tiles ${isHour ? 'three' : 'four'}`}>
          {sel.kind === 'hour' ? (
            <>
              {sel.h.humidity != null && <Tile cls="hum" glyph="humidity" value={num(sel.h.humidity)} unit="٪" label="رطوبت" />}
              {sel.h.windSpeed != null && <Tile cls="wind" glyph="wind" value={num(sel.h.windSpeed)} unit="کیلومتر/ساعت" sub={<WindSub dir={sel.h.windDirection} gust={sel.h.windGusts} speed={sel.h.windSpeed} />} label="باد" />}
              {sel.h.precipitationProbability != null && <Tile cls="rain" glyph="rain-prob" value={num(sel.h.precipitationProbability)} unit="٪" sub={sel.h.precipitation != null ? `${num(sel.h.precipitation, 1)} میلی‌متر` : undefined} label="احتمال بارش" />}
              {sel.h.pressure != null && <Tile cls="press" glyph="pressure" value={num(sel.h.pressure)} unit="هکتوپاسکال" label="فشار هوا" />}
              {km(sel.h.visibility) && <Tile cls="vis" glyph="eye" value={km(sel.h.visibility)!} unit="کیلومتر" label="دید افقی" />}
              {sel.h.apparent != null && <Tile cls="feel" glyph="thermo" value={degree(sel.h.apparent)} unit="دمای حس‌شده" label="دمای حس‌شده" />}
              {sel.h.cloudCover != null && <Tile cls="cloud" glyph="cloud" value={num(sel.h.cloudCover)} unit="٪" label="پوشش ابر" />}
              {aqiTile(sel.h.aqi)}
              {sel.h.isDay !== false && uvTile(sel.h.uv)}
            </>
          ) : (
            <>
              {sel.d.pressure != null && <Tile cls="press" glyph="pressure" value={num(sel.d.pressure)} unit="هکتوپاسکال" label="فشار هوا" />}
              {sel.d.humidity != null && <Tile cls="hum" glyph="humidity" value={`${num(sel.d.humidity)}٪`} bar={sel.d.humidity} label="رطوبت" />}
              {sel.d.windMax != null && <Tile cls="wind" glyph="wind" value={num(sel.d.windMax)} unit="کیلومتر/ساعت" sub={<WindSub dir={sel.d.windDirection} gust={sel.d.gustMax} speed={sel.d.windMax} />} label="باد (بیشینه)" />}
              {sel.d.precipitationProbability != null && <Tile cls="rain" glyph="rain-cloud" value={`${num(sel.d.precipitationProbability)}٪`} sub={sel.d.precipitationSum != null ? `${num(sel.d.precipitationSum, 1)} میلی‌متر` : undefined} label="احتمال بارش" />}
              {km(sel.d.visibility) && <Tile cls="vis" glyph="eye" value={km(sel.d.visibility)!} unit="کیلومتر" label="دید افقی" />}
              {sel.d.apparentMax != null && sel.d.apparentMin != null && <Tile cls="feel" glyph="thermo" value={degree((sel.d.apparentMax + sel.d.apparentMin) / 2)} unit="دمای حس‌شده" label="دمای حس‌شده (میانگین)" />}
              {aqiTile(sel.d.aqi)}
              {uvTile(sel.d.uvMax)}
            </>
          )}
        </div>
        {day && (day.sunrise || day.sunset) && (
          <div className="wp-sun" aria-label="طلوع و غروب">
            <div><Glyph name="sunrise" size={26} /><strong>{clockOf(day.sunrise)}</strong></div>
            <div className="wp-sun-mid"><Arc sunrise={day.sunrise} sunset={day.sunset} now={day.date === isoDay(now) ? now : null} /><span>{dayLength(day.sunrise, day.sunset)}</span></div>
            <div><Glyph name="sunset" size={26} /><strong>{clockOf(day.sunset)}</strong></div>
          </div>
        )}
      </section>
    </div>
  )
}

const jalaliShort = (iso: string) => { const [y, m, d] = iso.split('-').map(Number), j = fromGregorian(new Date(y, m - 1, d, 12)); return `${faNum(j.day)} ${MONTHS[j.month - 1]}` }
const weekday = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return WEEKDAYS[(new Date(y, m - 1, d, 12).getDay() + 1) % 7] }

// صفحهٔ آب‌وهوا (با زدن کارت صفحهٔ اول): بالا وضعیت اکنون، پایین ساعتی و ده روز آینده؛ با زدن هر ردیف جزئیات در یک پنجره باز می‌شود.
export default function WeatherPage() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const s = useCurrentWeather()
  const ov = useOverlay('wx')
  const [sel, setSel] = useState<Sel | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => weatherStore.start(), [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t) }, [])
  // دادهٔ ذخیره‌شدهٔ قدیمی (بدون پیش‌بینی ده‌روزه) یک‌بار تازه می‌شود
  useEffect(() => { const w = weatherStore.getState().weather; if (w && (!w.daily?.length || !w.hourly?.[0]?.pressure)) void weatherStore.retry() }, [])
  const coords = weatherStore.getCoords()
  useEffect(() => { if (coords) void reverseGeocode(coords.lat, coords.lon).then(setCity) }, [coords?.lat, coords?.lon])

  const w = s.weather
  const todayIso = isoDay(now)
  const hourly = useMemo(() => (w?.hourly ?? []).filter((h) => h.time.slice(0, 13) >= `${todayIso}T${iso2(now.getHours())}`).slice(0, 24), [w, todayIso, now.getHours()])
  const daily = useMemo(() => (w?.daily ?? []).filter((d) => d.date >= todayIso), [w, todayIso])
  const open = (x: Sel) => { setSel(x); ov.show() }
  const close = () => { ov.hide(); setSel(null) }
  const jd = fromGregorian(now)
  const icon = w ? weatherIconName(w.weatherCode, w.isDay) : null
  const sunset = daily[0]?.sunset

  return (
    <div className="tp-page wp" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="آب‌وهوا" backFallback="/" />
      <main className="wp-main">
        {!w ? (
          <p className="wp-empty" role="status">
            {s.status === 'locating' || s.status === 'loading' ? 'در حال دریافت…' : 'هنوز آب‌وهوایی دریافت نشده است.'}
            {s.status !== 'locating' && s.status !== 'loading' && <button type="button" className="wx-btn" onClick={() => void (s.status === 'idle' ? weatherStore.request() : weatherStore.retry())}>{s.status === 'idle' ? 'آب‌وهوای من' : 'تلاش مجدد'}</button>}
          </p>
        ) : (
          <>
            {city && <h1 className="wp-city"><Glyph name="pin" size={20} />{city}</h1>}
            <section className="wp-hero" aria-label="هوای اکنون">
              <div className="wp-hero-text">
                <span className="wp-date">{WEEKDAYS[(now.getDay() + 1) % 7]}، {faNum(jd.day)} {MONTHS[jd.month - 1]}</span>
                <strong className="wp-big">{degree(w.temperature)}</strong>
                <span className="wp-state">{weatherCodeText(w.weatherCode) ?? ''}</span>
                {w.apparentTemperature != null && <span className="wp-muted">احساس واقعی {degree(w.apparentTemperature)}</span>}
              </div>
              {icon && <span className={`wp-disc huge ${isWarmIcon(icon) ? 'warm' : 'cool'}`}><WeatherIcon name={icon} /></span>}
            </section>
            <div className="wp-stats">
              <span><Glyph name="thermo" size={20} />بیشینه {degree(w.tempMax)}</span>
              {w.windSpeed != null && <span><Glyph name="wind" size={20} />باد {num(w.windSpeed)} کیلومتر/ساعت</span>}
              {w.humidity != null && <span><Glyph name="humidity" size={20} />رطوبت {num(w.humidity)}٪</span>}
            </div>
            {s.error && <p className="wp-warn" role="alert">به‌روزرسانی ناموفق بود؛ آخرین داده نمایش داده می‌شود. <button type="button" className="wx-btn" onClick={() => void weatherStore.retry()}>تلاش مجدد</button></p>}
            <div className="wp-cards">
              <section className="wp-card" aria-label="ساعتی">
                <h2>ساعتی</h2><p className="wp-sub">۲۴ ساعت آینده</p>
                {hourly.length ? (
                  <ul className="wp-list wp-scroll">
                    {hourly.map((h, i) => (
                      <li key={h.time}><button type="button" className={`wp-item${i === 0 ? ' now' : ''}`} aria-label={`${hourLabel(h.time)} ${degree(h.temperature)} جزئیات`} onClick={() => open({ kind: 'hour', h })}>
                        <span className="wp-it"><b>{i === 0 ? 'اکنون' : hourLabel(h.time)}</b>{h.precipitationProbability != null && <small>بارش {num(h.precipitationProbability)}٪</small>}</span>
                        <Sky code={h.weatherCode} day={h.isDay} />
                        <strong className="wp-hi">{degree(h.temperature)}</strong>
                      </button></li>
                    ))}
                  </ul>
                ) : <p className="wp-empty">در دسترس نیست.</p>}
                {sunset && <p className="wp-foot">غروب آفتاب {clockOf(sunset)}</p>}
              </section>
              <section className="wp-card" aria-label="ده روز آینده">
                <h2>۱۰ روز آینده</h2><p className="wp-sub">بیشینه و کمینهٔ دما</p>
                {daily.length ? (
                  <ul className="wp-list">
                    {daily.map((d, i) => (
                      <li key={d.date}><button type="button" className={`wp-item${i === 0 ? ' now' : ''}`} aria-label={`${dayLabel(d.date)} بیشینه ${degree(d.tempMax)} کمینه ${degree(d.tempMin)} جزئیات`} onClick={() => open({ kind: 'day', d, today: i === 0 })}>
                        <span className="wp-it"><b>{i === 0 ? 'امروز' : i === 1 ? 'فردا' : weekday(d.date)}</b><small>{jalaliShort(d.date)}</small></span>
                        <Sky code={d.weatherCode} day />
                        <strong className="wp-hi">{degree(d.tempMax)}</strong>
                        <span className="wp-lo">{degree(d.tempMin)}</span>
                      </button></li>
                    ))}
                  </ul>
                ) : <p className="wp-empty">در دسترس نیست.</p>}
              </section>
            </div>
            <p className="wp-upd"><span>آخرین به‌روزرسانی: {s.updatedAt ? formatClock(new Date(s.updatedAt)) : '—'} • دما بر حسب سلسیوس • منبع: Open-Meteo</span><button type="button" className="wp-refresh" aria-label="به‌روزرسانی" onClick={() => void weatherStore.retry()}><Glyph name="refresh" size={18} /></button></p>
          </>
        )}
      </main>
      {w && sel && ov.open && <Dialog sel={sel} onClose={close} w={w} now={now} />}
    </div>
  )
}
