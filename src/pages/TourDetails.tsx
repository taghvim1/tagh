import AppChrome from '../components/AppChrome'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { findOrganizer, useOrganizers } from '../tour-organizers/repository'
import { findTour, useTours } from '../tours/repository'
import TourContent from '../tours/TourContent'

// جزئیات کامل تور (/tours/:id)
export default function TourDetails({ id }: { id: number }) {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const tour = findTour(useTours(), id)
  const organizer = tour && findOrganizer(useOrganizers(), tour.organizerId)
  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/tours" />
      <main className="tp-main">
        {tour && tour.active ? <TourContent tour={tour} organizer={organizer} /> : <header className="tp-head"><h1>تور پیدا نشد</h1><p className="tp-lead">این تور وجود ندارد یا دیگر نمایش داده نمی‌شود.</p></header>}
      </main>
    </div>
  )
}
