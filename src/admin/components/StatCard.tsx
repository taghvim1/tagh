import Icon, { type IconName } from './Icon'

/** رنگ‌های معنایی چیپ آیکون آمار */
export const STAT_TONES = ['teal', 'blue', 'green', 'amber', 'violet', 'red'] as const
export type StatTone = (typeof STAT_TONES)[number]

interface Props {
  title: string
  value: string
  description: string
  icon: IconName
  tone?: StatTone
}

export default function StatCard({ title, value, description, icon, tone = 'teal' }: Props) {
  return (
    <article className="adm-stat">
      <span className={`adm-stat-icon ${tone}`}><Icon name={icon} /></span>
      <div className="adm-stat-text">
        <span className="adm-label">{title}</span>
        <strong className="adm-value">{value}</strong>
        <span className="adm-note">{description}</span>
      </div>
    </article>
  )
}
