import { useEffect, useMemo, useRef, useState } from 'react'
import AdvancedFilter from '../components/AdvancedFilter'
import AppChrome from '../components/AppChrome'
import CenterModal from '../components/CenterModal'
import DestinationCard from '../components/DestinationCard'
import DestinationContent from '../components/DestinationContent'
import SeasonPicker from '../components/SeasonPicker'
import type { Destination, Season } from '../data/destinations'
import { faNum, fromGregorian } from '../lib/jalali'
import { useOverlay } from '../lib/overlay'
import { useSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { getSaved, saveState } from '../lib/travelFilterStore'
import { activeFilterCount, EMPTY_FILTERS, summarize, type TravelFilters } from '../travel/filters'
import { recommend } from '../travel/recommend'
import { useDestinations } from '../travel/repository'
import { seasonOfMonth } from '../travel/season'
import { useHistoricalClimate } from '../weather/history/store'

// فصل نقطهٔ شروع است: پیش‌فرض فصل تاریخ انتخاب‌شده در تقویم (یا فصل جاری)؛ فقط مقصدهای واقعاً مناسب آن فصل نمایش داده می‌شوند.
export default function TravelSuggestions() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)

  const today = useMemo(() => fromGregorian(new Date()), [])
  const date = useSelectedDate() ?? today
  const baseSeason = seasonOfMonth(date.month)

  // انتخاب دستی فصل تا وقتی معتبر است که فصلِ تاریخ تقویم عوض نشده باشد
  const [chosen, setChosen] = useState<Season | null>(() => {
    const s = getSaved()
    return s.season && s.baseSeason === baseSeason ? s.season : null
  })
  const prevBase = useRef(baseSeason)
  useEffect(() => {
    if (prevBase.current !== baseSeason) { prevBase.current = baseSeason; setChosen(null); saveState({ season: null, baseSeason }) }
  }, [baseSeason])
  const season = chosen ?? baseSeason
  const pick = (s: Season | null) => { setChosen(s); saveState({ season: s, baseSeason }) }

  const [filters, setFilters] = useState<TravelFilters>(() => getSaved().filters)
  const apply = (f: TravelFilters) => { setFilters(f); saveState({ filters: f }) }

  const all = useDestinations()
  const climate = useHistoricalClimate()
  const result = useMemo(() => recommend(all, { season, filters, climate }), [all, season, filters, climate])
  const count = activeFilterCount(filters)
  const active = summarize(filters)

  const sheet = useOverlay('filters')
  const popup = useOverlay('dest')
  const [openId, setOpenId] = useState<number | null>(null)
  const current = all.find((d) => d.id === openId)
  const open = (d: Destination) => { setOpenId(d.id); popup.show() }

  const section = (title: string, list: Destination[]) => (
    <div className="tp-section">
      <h3>{title}</h3>
      {list.length > 0 ? (
        <div className="dest-grid">{list.map((d) => <DestinationCard key={d.id} destination={d} onOpen={open} />)}</div>
      ) : (
        <p className="tp-empty">برای {season} مقصد مناسبی در این بخش پیدا نشد{count > 0 ? '؛ فیلترها را تغییر دهید.' : '.'}</p>
      )}
    </div>
  )

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head">
          <h1>پیشنهاد سفر</h1>
          <p className="tp-lead">بهترین مقصدها را بر اساس فصل انتخاب کن.</p>
        </header>

        <section className="tp-step" aria-labelledby="season-title">
          <h2 id="season-title" className="tp-step-title">چه فصلی سفر می‌کنی؟</h2>
          <SeasonPicker value={season} onChange={pick} />
        </section>

        <section className="tp-results" aria-label="نتایج">
          <h2 className="tp-results-title">پیشنهادهای سفر در {season}</h2>
          <p className="tp-sub">مقصدهایی که در این فصل بهترین شرایط سفر را دارند.</p>
          {active.length > 0 && (
            <p className="tp-active">
              {active.map(([label, value]) => `${label}: ${value}`).join(' · ')}{' '}
              <button type="button" className="tp-link" onClick={() => apply(EMPTY_FILTERS)}>پاک کردن</button>
            </p>
          )}
          {filters.scope !== 'خارجی' && section('پیشنهادهای داخلی', result.domestic)}
          {filters.scope !== 'داخلی' && section('پیشنهادهای خارجی', result.international)}

          <button type="button" className="tp-btn adv-btn" aria-haspopup="dialog" onClick={sheet.show}>
            فیلتر پیشرفته{count > 0 ? ` (${faNum(count)})` : ''}
          </button>
        </section>
      </main>

      <AdvancedFilter open={sheet.open} onClose={sheet.hide} value={filters} season={season} defaultSeason={baseSeason}
        onApply={(f, s) => { apply(f); pick(s === baseSeason ? null : s) }} />
      <CenterModal open={popup.open && !!current} onClose={popup.hide} label={current?.name ?? 'جزئیات مقصد'}>
        {current && <DestinationContent destination={current} season={season} onClose={popup.hide} />}
      </CenterModal>
    </div>
  )
}
