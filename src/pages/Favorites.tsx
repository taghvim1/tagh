import { useMemo, useState } from 'react'
import AppChrome from '../components/AppChrome'
import CenterModal from '../components/CenterModal'
import DestinationCard from '../components/DestinationCard'
import DestinationContent from '../components/DestinationContent'
import type { Destination } from '../data/destinations'
import { useFavorites } from '../lib/favorites'
import { faNum, fromGregorian } from '../lib/jalali'
import { useOverlay } from '../lib/overlay'
import { useSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { findOrganizer, useOrganizers } from '../tour-organizers/repository'
import { publicTours } from '../tours/logic'
import { useTours } from '../tours/repository'
import TourCard from '../tours/TourCard'
import TourContent from '../tours/TourContent'
import type { Tour } from '../tours/types'
import { useDestinations } from '../travel/repository'
import { seasonOfMonth } from '../travel/season'

type Opened = { kind: 'destination'; item: Destination } | { kind: 'tour'; item: Tour } | null

// علاقه‌مندی‌های کاربر (ذخیره در همین دستگاه). مقصدها و تورها جدا نمایش داده می‌شوند.
export default function Favorites() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const favs = useFavorites()
  const destinations = useDestinations()
  const tours = useTours()
  const organizers = useOrganizers()
  const today = useMemo(() => fromGregorian(new Date()), [])
  const season = seasonOfMonth((useSelectedDate() ?? today).month)

  const favDestinations = useMemo(() => destinations.filter((d) => d.enabled && favs.destination.includes(d.id)), [destinations, favs])
  const favTours = useMemo(() => publicTours(tours, organizers).filter((t) => favs.tour.includes(t.id)), [tours, organizers, favs])

  const popup = useOverlay('favorite')
  // نمونهٔ باز‌شده نگه داشته می‌شود تا با برداشتن علاقه‌مندی، پنجره ناگهان بسته نشود
  const [opened, setOpened] = useState<Opened>(null)
  const open = (o: NonNullable<Opened>) => { setOpened(o); popup.show() }
  const total = favDestinations.length + favTours.length

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/" />
      <main className="tp-main">
        <header className="tp-head">
          <h1>علاقه‌مندی‌ها</h1>
          <p className="tp-lead">مقصدها و تورهایی که برای خودت نگه داشته‌ای.</p>
        </header>

        {total === 0 ? (
          <div className="tp-placeholder">
            <strong>هنوز چیزی ذخیره نکرده‌ای</strong>
            <p>در جزئیات هر مقصد یا تور، دکمهٔ «افزودن به علاقه‌مندی‌ها» را بزن تا اینجا بیاید.</p>
          </div>
        ) : (
          <>
            {favDestinations.length > 0 && (
              <div className="tp-section">
                <h3>مقصدها ({faNum(favDestinations.length)})</h3>
                <div className="dest-grid">{favDestinations.map((d) => <DestinationCard key={d.id} destination={d} onOpen={(x) => open({ kind: 'destination', item: x })} />)}</div>
              </div>
            )}
            {favTours.length > 0 && (
              <div className="tp-section">
                <h3>تورها ({faNum(favTours.length)})</h3>
                <div className="dest-grid">{favTours.map((t) => <TourCard key={t.id} tour={t} onOpen={(x) => open({ kind: 'tour', item: x })} />)}</div>
              </div>
            )}
          </>
        )}
      </main>

      <CenterModal open={popup.open && !!opened} onClose={popup.hide} label={opened?.kind === 'tour' ? opened.item.title : opened?.item.name ?? 'جزئیات'}>
        {opened?.kind === 'destination' && <DestinationContent destination={opened.item} season={season} onClose={popup.hide} />}
        {opened?.kind === 'tour' && <TourContent tour={opened.item} organizer={findOrganizer(organizers, opened.item.organizerId)} />}
      </CenterModal>
    </div>
  )
}
