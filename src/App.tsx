import { lazy, Suspense } from 'react'
import CalendarPage from './pages/CalendarPage'
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

  return <CalendarPage />
}
