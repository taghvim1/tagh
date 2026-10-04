import Icon, { type IconName } from './Icon'

interface Props {
  title: string
  value: string
  description: string
  icon: IconName
}

export default function StatCard({ title, value, description, icon }: Props) {
  return (
    <article className="adm-stat">
      <span className="adm-stat-icon"><Icon name={icon} /></span>
      <div className="adm-stat-text">
        <span className="adm-label">{title}</span>
        <strong className="adm-value">{value}</strong>
        <span className="adm-note">{description}</span>
      </div>
    </article>
  )
}
