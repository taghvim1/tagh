import { Link } from '../../lib/router'
import Icon, { type IconName } from './Icon'

interface Props {
  title: string
  description: string
  path: string
  icon: IconName
}

export default function QuickAction({ title, description, path, icon }: Props) {
  return (
    <Link to={path} className="adm-action">
      <span className="adm-stat-icon"><Icon name={icon} /></span>
      <span className="adm-action-text">
        <strong>{title}</strong>
        <span className="adm-note">{description}</span>
      </span>
      <span className="adm-action-arrow" aria-hidden="true">‹</span>
    </Link>
  )
}
