import type { ReactNode } from 'react'
import { useAnimatedMount, useEscape } from '../lib/useAnimatedMount'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  onApply: () => void
  onReset: () => void
  children: ReactNode
}

// پایین‌برگه (موبایل) / پنجرهٔ وسط (دسکتاپ) برای فیلترها؛ فقط هنگام باز بودن در DOM است
export default function FilterSheet({ open, onClose, title, onApply, onReset, children }: Props) {
  const { mounted, shown } = useAnimatedMount(open)
  useEscape(open, onClose)
  if (!mounted) return null
  return (
    <>
      <button className={`af-backdrop${shown ? ' open' : ''}`} aria-label="بستن فیلتر" tabIndex={-1} onClick={onClose} />
      <section className={`af${shown ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="af-head">
          <h2>{title}</h2>
          <button type="button" className="af-close" aria-label="بستن" onClick={onClose}>×</button>
        </div>
        <div className="af-body">{children}</div>
        <div className="af-foot">
          <button type="button" className="tp-btn primary" onClick={onApply}>اعمال فیلترها</button>
          <button type="button" className="tp-btn" onClick={onReset}>پاک کردن فیلترها</button>
        </div>
      </section>
    </>
  )
}
