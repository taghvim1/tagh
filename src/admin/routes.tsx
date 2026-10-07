import type { ReactElement } from 'react'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import Events from './pages/Events'
import ManageDestinations from './pages/ManageDestinations'
import ManageTours from './pages/ManageTours'
import SeasonalRecommendations from './pages/SeasonalRecommendations'
import Settings from './pages/Settings'
import Users from './pages/Users'

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
  { path: '/admin/destinations', title: 'مقصدها', element: <ManageDestinations /> },
  { path: '/admin/seasonal', title: 'پیشنهادهای فصلی', element: <SeasonalRecommendations /> },
  { path: '/admin/tours', title: 'تورها', element: <ManageTours /> },
  { path: '/admin/users', title: 'کاربران', element: <Users /> },
  { path: '/admin/settings', title: 'تنظیمات', element: <Settings /> },
]
