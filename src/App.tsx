import { lazy, Suspense } from 'react'
import CalendarPage from './pages/CalendarPage'
import DestinationDetails from './pages/DestinationDetails'
import TourDetails from './pages/TourDetails'
import Tours from './pages/Tours'
import TravelSuggestions from './pages/TravelSuggestions'
import { usePath } from './lib/router'

// پنل مدیریت جدا بارگذاری می‌شود و روی بستهٔ تقویم اثری ندارد
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  const path = usePath()

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <Suspense fallback={null}>
        <AdminApp path={path} />
      </Suspense>
    )
  }

  if (path === '/travel-suggestions') return <TravelSuggestions />
  if (path === '/tours') return <Tours />
  const tour = path.match(/^\/tours\/(\d+)$/)
  if (tour) return <TourDetails id={Number(tour[1])} />
  const details = path.match(/^\/travel-suggestions\/destination\/(\d+)$/)
  if (details) return <DestinationDetails id={Number(details[1])} />

  return <CalendarPage />
}
