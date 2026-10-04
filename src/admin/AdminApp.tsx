import AdminLayout from './components/AdminLayout'
import ComingSoon from './pages/ComingSoon'
import { ADMIN_ROUTES } from './routes'
import './admin.css'

export default function AdminApp({ path }: { path: string }) {
  const route = ADMIN_ROUTES.find((r) => r.path === path)
  return (
    <AdminLayout path={path} title={route?.title ?? 'صفحه پیدا نشد'}>
      {route?.element ?? <ComingSoon text="صفحهٔ موردنظر پیدا نشد." />}
    </AdminLayout>
  )
}
