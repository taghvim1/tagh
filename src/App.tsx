import { lazy, Suspense } from 'react'
import Calendar from './components/Calendar'
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

  return (
    <main className="app">
      <Calendar />
    </main>
  )
}
