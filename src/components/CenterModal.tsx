import type { ReactNode } from 'react'
import { useAnimatedMount, useEscape } from '../lib/useAnimatedMount'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

// پنجرهٔ مرکزی با پس‌زمینهٔ تیره و محو؛ محتوا قابل اسکرول است
export default function CenterModal({ open, onClose, label, children }: Props) {
  const { mounted, shown } = useAnimatedMount(open, 220)
  useEscape(open, onClose)
  if (!mounted) return null
  return (
    <div className={`cm-root${shown ? ' open' : ''}`}>
      <button className="cm-backdrop" aria-label="بستن" tabIndex={-1} onClick={onClose} />
      <section className="cm" role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="cm-close" aria-label="بستن" onClick={onClose}>×</button>
        <div className="cm-scroll">{children}</div>
      </section>
    </div>
  )
}
