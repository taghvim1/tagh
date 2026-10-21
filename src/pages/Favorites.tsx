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
import { useAllDestinations } from '../travel/remote'
import PackageView from '../package/PackageView'
import { removePackage, useSavedPackages } from '../package/saved'
import { imagesOf, type TourPackage } from '../package/types'
import { seasonOfMonth } from '../travel/season'

type Opened = { kind: 'destination'; item: Destination } | { kind: 'tour'; item: Tour } | null

// علاقه‌مندی‌های کاربر (ذخیره در همین دستگاه). مقصدها و تورها جدا نمایش داده می‌شوند.
export default function Favorites() {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const favs = useFavorites()
  const destinations = useAllDestinations()
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
  const pkgs = useSavedPackages()
  const [openPkg, setOpenPkg] = useState<TourPackage | null>(null)
  const pkgPopup = useOverlay('favorite-package')
  const total = favDestinations.length + favTours.length + pkgs.length

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
            <p>در جزئیات هر مقصد یا تور، دکمهٔ «افزودن به علاقه‌مندی‌ها» را بزن تا اینجا بیاید. پکیج‌های تور هم همین‌جا ذخیره می‌شوند.</p>
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
            {pkgs.length > 0 && (
              <div className="tp-section">
                <h3>پکیج‌های تور ({faNum(pkgs.length)})</h3>
                <ul className="pk-saved">
                  {pkgs.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="pk-saved-open" onClick={() => { setOpenPkg(p); pkgPopup.show() }}>
                        {imagesOf(p)[0] ? <img src={imagesOf(p)[0].url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="pk-saved-ph" aria-hidden="true" />}
                        <span><strong>{p.content.title}</strong><small>{p.input.origin} ← {p.input.destination} · {faNum(p.input.days)} روز</small></span>
                      </button>
                      <button type="button" className="pk-saved-del" aria-label={`حذف ${p.content.title}`} onClick={() => { if (window.confirm("این پکیج از علاقه‌مندی‌ها حذف شود؟")) removePackage(p.id) }}>×</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
      <CenterModal open={pkgPopup.open && !!openPkg} onClose={pkgPopup.hide} label={openPkg?.content.title ?? 'پکیج تور'}>
        {openPkg && <PackageView pkg={openPkg} />}
      </CenterModal>

      <CenterModal open={popup.open && !!opened} onClose={popup.hide} label={opened?.kind === 'tour' ? opened.item.title : opened?.item.name ?? 'جزئیات'}>
        {opened?.kind === 'destination' && <DestinationContent destination={opened.item} season={season} />}
        {opened?.kind === 'tour' && <TourContent tour={opened.item} organizer={findOrganizer(organizers, opened.item.organizerId)} />}
      </CenterModal>
    </div>
  )
}
