import { useMemo, useRef, useState, type FormEvent } from 'react'
import AppChrome from '../components/AppChrome'
import ChipGroup from '../components/ChipGroup'
import DestinationCard from '../components/DestinationCard'
import TripDate from '../components/TripDate'
import { MOCK_DESTINATIONS, type Destination } from '../data/destinations'
import { BackLink } from '../lib/router'
import { fromGregorian } from '../lib/jalali'
import { setSelectedDate, useSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { getSavedFilters, saveFilters } from '../lib/travelFilterStore'
import { BUDGET_OPTIONS, DURATION_OPTIONS, EMPTY_FILTERS, SCOPE_OPTIONS, TYPE_OPTIONS, summarize, type TravelFilters } from '../travel/filters'
import { recommend } from '../travel/recommend'
import { faNum } from '../lib/jalali'

// تاریخ (از تقویم یا امروز) + فیلترها → موتور پیشنهاد؛ هر تغییر بلافاصله اعمال می‌شود.
export default function TravelSuggestions() {
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)

  const today = useMemo(() => fromGregorian(new Date()), [])
  const date = useSelectedDate() ?? today // ورود مستقیم: تاریخ جاری

  const [filters, setFilters] = useState<TravelFilters>(getSavedFilters)
  const update = (next: TravelFilters) => { setFilters(next); saveFilters(next) }
  const set = <K extends keyof TravelFilters>(key: K, value: TravelFilters[K]) => update({ ...filters, [key]: value })
  const reset = () => update(EMPTY_FILTERS)

  const { season, suitable, others } = useMemo(() => recommend(MOCK_DESTINATIONS, { date, filters }), [date, filters])
  const total = suitable.length + others.length
  const active = summarize(filters)
  const results = useRef<HTMLElement>(null)

  const cards = (list: Destination[]) => (
    <div className="dest-grid">{list.map((d) => <DestinationCard key={d.id} destination={d} season={season} />)}</div>
  )

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" dark={dark} onDarkChange={setDark} />
      <main className="tp-main">
        <BackLink fallback="/" className="tp-back"><span aria-hidden="true">›</span> بازگشت به تقویم</BackLink>

        <header className="tp-head">
          <h1>پیشنهاد سفر</h1>
          <p className="tp-lead">بر اساس زمان سفر و انتخاب‌های شما، مقصدهای مناسب را پیدا کنید.</p>
        </header>

        <TripDate date={date} season={season} onChange={setSelectedDate} />

        <form className="tp-form" onSubmit={(e: FormEvent) => e.preventDefault()} noValidate>
          <label className="tp-field">
            <span className="tp-label">مقصد</span>
            <input className="tp-input" value={filters.destination} onChange={(e) => set('destination', e.target.value)} placeholder="نام شهر یا کشور" />
          </label>
          <ChipGroup label="نوع مقصد" options={SCOPE_OPTIONS} value={filters.scope} onChange={(v) => set('scope', v)} />
          <ChipGroup label="نوع سفر" options={TYPE_OPTIONS} value={filters.type} onChange={(v) => set('type', v)} />
          <ChipGroup label="مدت سفر" options={DURATION_OPTIONS} value={filters.duration} onChange={(v) => set('duration', v)} />
          <ChipGroup label="بودجه" options={BUDGET_OPTIONS} value={filters.budget} onChange={(v) => set('budget', v)} />
          <div className="tp-actions">
            {/* نتایج با هر تغییر به‌روز می‌شوند؛ این دکمه فقط به بخش نتایج می‌برد */}
            <button type="button" className="tp-btn primary" onClick={() => results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>نمایش پیشنهادها</button>
            <button type="button" className="tp-btn" onClick={reset}>پاک کردن فیلترها</button>
          </div>
        </form>

        <section className="tp-results" ref={results} aria-label="نتایج">
          <div className="tp-results-head">
            <h2>پیشنهادهای سفر</h2>
            <span className="tp-count" aria-live="polite">{faNum(total)} مقصد</span>
          </div>
          {active.length > 0 && <p className="tp-active">{active.map(([label, value]) => `${label}: ${value}`).join(' · ')}</p>}

          {total === 0 ? (
            <div className="tp-placeholder">
              <strong>مقصد مناسبی پیدا نشد</strong>
              <p>فیلترها را تغییر دهید یا همه فیلترها را پاک کنید.</p>
              <button type="button" className="tp-btn" onClick={reset}>پاک کردن فیلترها</button>
            </div>
          ) : (
            <>
              <div className="tp-section">
                <h3>پیشنهادهای مناسب برای شما</h3>
                <p className="tp-sub">مقصدهایی که با زمان سفر و انتخاب‌های شما هماهنگی بیشتری دارند.</p>
                {suitable.length > 0 ? cards(suitable) : <p className="tp-empty">برای فصل {season} مقصد مناسبی با این فیلترها پیدا نشد.</p>}
              </div>
              {others.length > 0 && (
                <div className="tp-section">
                  <h3>پیشنهادهای دیگر</h3>
                  <p className="tp-sub">مقصدهای دیگری که می‌توانید بررسی کنید.</p>
                  {cards(others)}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
