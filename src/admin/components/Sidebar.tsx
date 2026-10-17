import { Fragment } from 'react'
import { Link } from '../../lib/router'
import Icon from './Icon'
import { ADMIN_ROUTES } from '../routes'

interface Props {
  path: string
  open: boolean
  onClose: () => void
}

export default function Sidebar({ path, open, onClose }: Props) {
  return (
    <aside id="adm-sidebar" className={`adm-sidebar${open ? ' open' : ''}`}>
      <div className="adm-brand">
        <span className="adm-brand-badge" aria-hidden="true"><Icon name="calendar" size={22} /></span>
        <span className="adm-brand-text">
          <strong>پنل مدیریت</strong>
          <small>تقویم سفری</small>
        </span>
      </div>
      <nav aria-label="منوی مدیریت">
        {ADMIN_ROUTES.map((r, i) => (
          <Fragment key={r.path}>
            {r.group && r.group !== ADMIN_ROUTES[i - 1]?.group && <span className="adm-group">{r.group}</span>}
            <Link to={r.path} className={r.path === path ? 'active' : ''} aria-current={r.path === path ? 'page' : undefined} onClick={onClose}>
              {r.icon && <span className="adm-nav-icon"><Icon name={r.icon} size={19} /></span>}
              {r.title}
            </Link>
          </Fragment>
        ))}
      </nav>
      <Link to="/" className="adm-back">بازگشت به تقویم</Link>
    </aside>
  )
}
