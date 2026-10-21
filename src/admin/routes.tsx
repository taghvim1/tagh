import type { ReactElement } from 'react'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'
import AiSuggestions from './pages/AiSuggestions'
import ApiSettings from './pages/ApiSettings'
import Suggestions from './pages/Suggestions'
import SuggestionsPreview from './pages/SuggestionsPreview'
import Events from './pages/Events'
import ManageDestinations from './pages/ManageDestinations'
import ManageTourOrganizers from './pages/ManageTourOrganizers'
import ManageTours from './pages/ManageTours'
import SeasonalRecommendations from './pages/SeasonalRecommendations'
import FeedAdmin from './pages/FeedAdmin'
import Settings from './pages/Settings'
import SmsLogin from './pages/SmsLogin'
import PackagePrompt from './pages/PackagePrompt'
import Users from './pages/Users'
import { FEED_KINDS, FEED_TITLE } from '../feed/topics'
import type { IconName } from './components/Icon'

export interface AdminRoute {
  path: string
  title: string
  element: ReactElement
  /** عنوان بخش در منوی کناری؛ با تغییر مقدار، عنوان تازه‌ای نمایش داده می‌شود */
  group?: string
  /** آیکون منو (تزئینی) */
  icon?: IconName
}

// منبع واحد مسیرها: منو، عنوان بالای صفحه و رندر صفحه از اینجا می‌آیند
export const ADMIN_ROUTES: AdminRoute[] = [
  { path: '/admin', title: 'داشبورد', element: <Dashboard />, icon: 'grid' },
  { path: '/admin/calendar', title: 'تقویم', element: <ComingSoon text="صفحه تقویم مدیریتی - به زودی" />, icon: 'calendar' },
  { path: '/admin/events', title: 'مناسبت‌ها', element: <Events />, icon: 'event' },
  { path: '/admin/suggestions', title: 'مدیریت پیشنهادها', element: <Suggestions />, group: 'پیشنهادهای سفر', icon: 'compass' },
  { path: '/admin/destinations', title: 'مقصدها', element: <ManageDestinations />, group: 'پیشنهادهای سفر', icon: 'pin' },
  { path: '/admin/suggestions-preview', title: 'پیش‌نمایش کاربر', element: <SuggestionsPreview />, group: 'پیشنهادهای سفر', icon: 'eye' },
  { path: '/admin/ai-suggestions', title: 'تولید با هوش مصنوعی', element: <AiSuggestions />, group: 'پیشنهادهای سفر', icon: 'spark' },
  { path: '/admin/seasonal', title: 'پیشنهادهای فصلی', element: <SeasonalRecommendations />, group: 'پیشنهادهای سفر', icon: 'leaf' },
  { path: '/admin/tour-organizers', title: 'برگزارکنندگان تور', element: <ManageTourOrganizers />, group: 'تورها', icon: 'users' },
  { path: '/admin/tours', title: 'تورهای ثبت‌شده', element: <ManageTours />, group: 'تورها', icon: 'ticket' },
  // محتوای صفحهٔ اصلی: هر موضوع یک بخش جدا با صف انتشار روزانهٔ خودش
  ...FEED_KINDS.map((k): AdminRoute => ({
    path: `/admin/feed/${k}`,
    title: FEED_TITLE[k],
    element: <FeedAdmin key={k} kind={k} />,
    group: k === 'dyk' ? 'صفحهٔ اول: آیا می‌دانستید' : 'صفحهٔ دوم: کاشی موضوعات',
    icon: k === 'dyk' ? 'bulb' : 'news',
  })),
  { path: '/admin/package', title: 'پکیج تور (پرامپت)', element: <PackagePrompt />, group: 'پکیج تور', icon: 'spark' },
  { path: '/admin/api-settings', title: 'تنظیمات API', element: <ApiSettings />, icon: 'key' },
  { path: '/admin/sms-login', title: 'ورود و ثبت‌نام پیامکی', element: <SmsLogin />, icon: 'mobile' },
  { path: '/admin/users', title: 'کاربران', element: <Users />, icon: 'chart' },
  { path: '/admin/settings', title: 'تنظیمات', element: <Settings />, icon: 'settings' },
]
