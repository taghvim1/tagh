import { useEffect } from 'react'
import { Link } from '../lib/router'

/** «ابرک»: حبابِ ابری‌شکل که چند ثانیه می‌ماند و خودش بسته می‌شود. */
export default function CloudToast({ open, onClose, text, linkTo, linkText }: { open: boolean; onClose: () => void; text: string; linkTo?: string; linkText?: string }) {
  useEffect(() => { if (!open) return; const t = window.setTimeout(onClose, 3500); return () => window.clearTimeout(t) }, [open, onClose])
  if (!open) return null
  return (
    <div className="pk-cloud" role="status" aria-live="polite">
      <span className="pk-cloud-icon" aria-hidden="true">♥</span>
      <span>{text}</span>
      {linkTo && <Link to={linkTo} className="pk-cloud-link">{linkText}</Link>}
    </div>
  )
}
