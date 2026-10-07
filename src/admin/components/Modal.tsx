import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

// بر پایهٔ <dialog> بومی: Escape، تله‌ی فوکوس و بازگشت فوکوس را خود مرورگر انجام می‌دهد.
export default function Modal({ title, onClose, children, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`adm-modal${wide ? ' wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="adm-modal-body">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
