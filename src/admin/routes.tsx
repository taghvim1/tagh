import type { ReactElement } from 'react'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import AiSuggestions from './pages/AiSuggestions'
import SuggestionsPreview from './pages/SuggestionsPreview'
import Events from './pages/Events'
import ManageDestinations from './pages/ManageDestinations'
import ManageTourOrganizers from './pages/ManageTourOrganizers'
import ManageTours from './pages/ManageTours'
import SeasonalRecommendations from './pages/SeasonalRecommendations'
import Settings from './pages/Settings'
import Users from './pages/Users'

export interface AdminRoute {
  path: string
  title: string
  element: ReactElement
  /** عنوان بخش در منوی کناری؛ با تغییر مقدار، عنوان تازه‌ای نمایش داده می‌شود */
  group?: string
}

// منبع واحد مسیرها: منو، عنوان بالای صفحه و رندر صفحه از اینجا می‌آیند
export const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/admin', title: 'داشبورد', element: <Dashboard /> },
  { path: '/admin/calendar', title: 'تقویم', element: <ComingSoon text="صفحه تقویم مدیریتی - به زودی" /> },
  { path: '/admin/events', title: 'مناسبت‌ها', element: <Events /> },
  { path: '/admin/destinations', title: 'مقصدها', element: <ManageDestinations />, group: 'پیشنهادهای سفر' },
  { path: '/admin/suggestions-preview', title: 'پیش‌نمایش کاربر', element: <SuggestionsPreview />, group: 'پیشنهادهای سفر' },
  { path: '/admin/ai-suggestions', title: 'تولید با هوش مصنوعی', element: <AiSuggestions />, group: 'پیشنهادهای سفر' },
  { path: '/admin/seasonal', title: 'پیشنهادهای فصلی', element: <SeasonalRecommendations />, group: 'پیشنهادهای سفر' },
  { path: '/admin/tour-organizers', title: 'برگزارکنندگان تور', element: <ManageTourOrganizers />, group: 'تورها' },
  { path: '/admin/tours', title: 'تورهای ثبت‌شده', element: <ManageTours />, group: 'تورها' },
  { path: '/admin/users', title: 'کاربران', element: <Users /> },
  { path: '/admin/settings', title: 'تنظیمات', element: <Settings /> },
]
