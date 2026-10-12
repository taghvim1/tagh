import AdminLayout from './components/AdminLayout'
import ComingSoon from './pages/ComingSoon'
import SuggestionDetail from './pages/SuggestionDetail'
import { ADMIN_ROUTES } from './routes'
import './admin.css'

export default function AdminApp({ path }: { path: string }) {
  const route = ADMIN_ROUTES.find((r) => r.path === path)
  const detail = path.match(/^\/admin\/suggestions\/(\d+)$/)
  if (detail) return <AdminLayout path="/admin/suggestions" title="جزئیات پیشنهاد"><SuggestionDetail id={Number(detail[1])} /></AdminLayout>
  return (
    <AdminLayout path={path} title={route?.title ?? 'صفحه پیدا نشد'}>
      {route?.element ?? <ComingSoon text="صفحهٔ موردنظر پیدا نشد." />}
    </AdminLayout>
  )
}
