import { useMemo, useState } from 'react'
import AppChrome from '../components/AppChrome'
import { faNum } from '../lib/jalali'
import { useOverlay } from '../lib/overlay'
import { navigate } from '../lib/router'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { activeTourFilterCount, EMPTY_TOUR_FILTERS, selectTours, type TourFilters } from '../tours/logic'
import { useTours } from '../tours/repository'
import TourCard from '../tours/TourCard'
import TourFilterSheet from '../tours/TourFilterSheet'
import { useOrganizers } from '../tour-organizers/repository'

// تورهای پیش‌رو؛ کاملاً جدا از پیشنهاد مقصد. فقط معرفی تور (بدون رزرو واقعی).
export default function Tours() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const all = useTours()
  const [filters, setFilters] = useState<TourFilters>(EMPTY_TOUR_FILTERS)
  const organizers = useOrganizers()
  const names = useMemo(() => new Map(organizers.map((o) => [o.id, o.name])), [organizers])
  const list = useMemo(() => selectTours(all, organizers, filters), [all, organizers, filters])
  const count = activeTourFilterCount(filters)

  const sheet = useOverlay('tour-filters')

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head">
          <h1>تورهای پیش‌رو</h1>
          <p className="tp-lead">تورهای نزدیک و قابل ثبت را ببین.</p>
        </header>

        <div className="tour-bar">
          <span className="tp-sub" aria-live="polite">{faNum(list.length)} تور</span>
          <button type="button" className="tp-btn" aria-haspopup="dialog" onClick={sheet.show}>فیلتر{count > 0 ? ` (${faNum(count)})` : ''}</button>
        </div>

        {list.length > 0 ? (
          <div className="tour-grid">{list.map((t) => <TourCard key={t.id} tour={t} organizerName={names.get(t.organizerId)} onOpen={(x) => navigate(`/tours/${x.id}`)} />)}</div>
        ) : (
          <div className="tp-placeholder">
            <strong>تور پیش‌رویی با این فیلترها پیدا نشد</strong>
            <p>فیلترها را تغییر دهید یا پاک کنید.</p>
            <button type="button" className="tp-btn" onClick={() => setFilters(EMPTY_TOUR_FILTERS)}>پاک کردن فیلترها</button>
          </div>
        )}
      </main>

      <TourFilterSheet open={sheet.open} onClose={sheet.hide} value={filters} onApply={setFilters} />
    </div>
  )
}
