import type { ReactElement } from 'react'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import Events from './pages/Events'

export interface AdminRoute {
  path: string
  title: string
  element: ReactElement
}

// منبع واحد مسیرها: منو، عنوان بالای صفحه و رندر صفحه از اینجا می‌آیند
export const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/admin', title: 'داشبورد', element: <Dashboard /> },
  { path: '/admin/calendar', title: 'تقویم', element: <ComingSoon text="صفحه تقویم مدیریتی - به زودی" /> },
  { path: '/admin/events', title: 'مناسبت‌ها', element: <Events /> },
  { path: '/admin/settings', title: 'تنظیمات', element: <ComingSoon text="تنظیمات سیستم - به زودی" /> },
]
