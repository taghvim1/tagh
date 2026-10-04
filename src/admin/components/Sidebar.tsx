import { Link } from '../../lib/router'
import { ADMIN_ROUTES } from '../routes'

interface Props {
  path: string
  open: boolean
  onClose: () => void
}

export default function Sidebar({ path, open, onClose }: Props) {
  return (
    <aside id="adm-sidebar" className={`adm-sidebar${open ? ' open' : ''}`}>
      <div className="adm-brand">پنل مدیریت تقویم</div>
      <nav aria-label="منوی مدیریت">
        {ADMIN_ROUTES.map((r) => (
          <Link key={r.path} to={r.path} className={r.path === path ? 'active' : ''} aria-current={r.path === path ? 'page' : undefined} onClick={onClose}>
            {r.title}
          </Link>
        ))}
      </nav>
      <Link to="/" className="adm-back">بازگشت به تقویم</Link>
    </aside>
  )
}
