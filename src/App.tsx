import { Suspense, useEffect } from 'react'
import { lazyWithRetry, RouteBoundary, SlowLoading } from './components/LazyBoundary'
import { trackRoute } from './analytics'
import CalendarPage from './pages/CalendarPage'
import NotesPage from './pages/NotesPage'
import Favorites from './pages/Favorites'
import DestinationDetails from './pages/DestinationDetails'
import TourDetails from './pages/TourDetails'
import SettingsPage from './pages/SettingsPage'
import Tours from './pages/Tours'
import TravelSuggestions from './pages/TravelSuggestions'
import { usePath } from './lib/router'

// پنل مدیریت جدا بارگذاری می‌شود و روی بستهٔ تقویم اثری ندارد
const AdminApp = lazyWithRetry(() => import('./admin/AdminApp'))

export default function App() {
  const path = usePath()
  useEffect(() => { if (!path.startsWith('/admin')) trackRoute(path) }, [path])

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <RouteBoundary>
        <Suspense fallback={<SlowLoading />}>
          <AdminApp path={path} />
        </Suspense>
      </RouteBoundary>
    )
  }

  if (path === '/travel-suggestions') return <TravelSuggestions />
  if (path === '/settings') return <SettingsPage />
  if (path === '/notes') return <NotesPage />
  if (path === '/favorites') return <Favorites />
  if (path === '/tours') return <Tours />
  const tour = path.match(/^\/tours\/(\d+)$/)
  if (tour) return <TourDetails id={Number(tour[1])} />
  const details = path.match(/^\/travel-suggestions\/destination\/(\d+)$/)
  if (details) return <DestinationDetails id={Number(details[1])} />

  return <CalendarPage />
}
