import { useCallback, useEffect, useState } from 'react'

// Overlayها (منو، اعلان‌ها) یک ورودی History می‌گیرند تا دکمهٔ Back فقط آن‌ها را ببندد و از برنامه خارج نشود.
const stateOf = () => (window.history.state ?? {}) as { overlay?: string }

export const overlayActive = (id: string) => stateOf().overlay === id

export function pushOverlay(id: string) {
  window.history.pushState({ ...stateOf(), overlay: id }, '')
}

/** بستن با رابط (دکمه/بیرون/Escape): ورودی History را برمی‌دارد؛ true یعنی popstate بسته‌شدن را اعلام می‌کند */
export function popOverlay(id: string): boolean {
  if (!overlayActive(id)) return false
  window.history.back()
  return true
}

export function useOverlay(id: string) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onPop = () => { if (!overlayActive(id)) setOpen(false) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [id])

  const show = useCallback(() => { pushOverlay(id); setOpen(true) }, [id])
  const hide = useCallback(() => { if (!popOverlay(id)) setOpen(false) }, [id])
  /** بستن بدون دست‌زدن به History (مثلاً هنگام رفتن به صفحهٔ دیگر) */
  const hideSilently = useCallback(() => setOpen(false), [])
  return { open, show, hide, hideSilently }
}
