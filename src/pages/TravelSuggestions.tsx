import { useMemo, useState, type FormEvent } from 'react'
import ChipGroup from '../components/ChipGroup'
import DestinationCard from '../components/DestinationCard'
import { MOCK_DESTINATIONS } from '../data/destinations'
import { recommend, seasonOfMonth } from '../data/recommend'
import { BUDGETS, DURATIONS, EMPTY_FILTERS, TRIP_TYPES, summarize, type TravelFilters } from '../data/travelFilters'
import { Link } from '../lib/router'
import { MONTHS, faNum, fromGregorian } from '../lib/jalali'
import { useSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// انتخاب‌های کاربر + فصلِ تاریخ انتخاب‌شده در تقویم → رتبه‌بندی مقصدهای Mock (Rule-Based).
export default function TravelSuggestions() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const date = useSelectedDate() ?? fromGregorian(new Date())
  const season = seasonOfMonth(date.month)

  const [filters, setFilters] = useState<TravelFilters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<TravelFilters>(EMPTY_FILTERS) // فیلترهای اعمال‌شده روی لیست
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const set = <K extends keyof TravelFilters>(key: K, value: TravelFilters[K]) => setFilters((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setApplied(filters)
  }
  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
  }

  const result = useMemo(() => recommend(MOCK_DESTINATIONS, { season, filters: applied }), [season, applied])
  const active = summarize(applied)

  const renderCards = (list: typeof result.suitable) => (
    <div className="dest-grid">
      {list.map((d) => (
        <DestinationCard key={d.id} destination={d} selected={d.id === selectedId} onSelect={() => setSelectedId(d.id === selectedId ? null : d.id)} />
      ))}
    </div>
  )

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <main className="tp-main">
        <Link to="/" className="tp-back"><span aria-hidden="true">›</span> بازگشت به تقویم</Link>

        <header className="tp-head">
          <h1>پیشنهاد سفر</h1>
          <p className="tp-lead">مقصد مناسب خودت را برای این تاریخ پیدا کن.</p>
          <p className="tp-sub">برای شروع، تاریخ و شرایط سفر خودت را انتخاب کن.</p>
        </header>

        <section className="tp-date" aria-label="تاریخ انتخاب‌شده">
          <span className="tp-label">تاریخ انتخاب‌شده</span>
          <strong>{faNum(date.day)} {MONTHS[date.month - 1]}</strong>
          <span className="tp-season">فصل: {season}</span>
        </section>

        <form className="tp-form" onSubmit={submit} noValidate>
          <label className="tp-field">
            <span className="tp-label">مقصد</span>
            <input className="tp-input" value={filters.destination} onChange={(e) => set('destination', e.target.value)} placeholder="مثلاً اصفهان، یزد، شمال..." />
          </label>
          <ChipGroup label="نوع سفر" options={TRIP_TYPES} value={filters.type} onChange={(v) => set('type', v)} />
          <ChipGroup label="مدت سفر" options={DURATIONS} value={filters.duration} onChange={(v) => set('duration', v)} />
          <ChipGroup label="بودجه" options={BUDGETS} value={filters.budget} onChange={(v) => set('budget', v)} />

          <div className="tp-actions">
            <button type="submit" className="tp-btn primary">نمایش پیشنهادها</button>
            <button type="button" className="tp-btn" onClick={reset}>پاک کردن فیلترها</button>
          </div>
        </form>

        <section className="tp-results" aria-label="نتایج">
          <div className="tp-results-head">
            <h2>پیشنهادهای سفر</h2>
            <span className="tp-count" aria-live="polite">{faNum(result.suitable.length + result.others.length)} مقصد</span>
          </div>
          {active.length > 0 && <p className="tp-active">{active.map(([label, value]) => `${label}: ${value}`).join(' · ')}</p>}
          {result.unknownDestination && <p className="tp-active">مقصدی با این نام در فهرست نیست؛ بهترین گزینه‌های دیگر نمایش داده شده‌اند.</p>}

          <div className="tp-section">
            <h3>پیشنهادهای مناسب برای {season}</h3>
            <p className="tp-sub">مقصدهایی که {season} برایشان فصل خوبی است، مرتب‌شده بر اساس انتخاب‌های شما</p>
            {result.suitable.length > 0 ? renderCards(result.suitable) : <p className="tp-empty">در این فصل مقصد مناسبی پیدا نشد.</p>}
          </div>

          {result.others.length > 0 && (
            <div className="tp-section">
              <h3>پیشنهادهای دیگر</h3>
              <p className="tp-sub">مقصدهایی که {season} برایشان فصل مناسبی نیست</p>
              {renderCards(result.others)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
