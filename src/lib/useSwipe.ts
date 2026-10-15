import { useRef } from 'react'

/** تشخیص کشیدن افقی (انگشت یا ماوس). راست‌به‌چپ = onLeft، چپ‌به‌راست = onRight. کشیدن عمودی نادیده گرفته می‌شود. */
export function useHSwipe(onLeft?: () => void, onRight?: () => void, min = 52) {
  const s = useRef<{ x: number; y: number; t: number; id: number } | null>(null)
  return {
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType === 'mouse' && e.button !== 0) return; s.current = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId } },
    onPointerUp: (e: React.PointerEvent) => {
      const p = s.current; s.current = null
      if (!p || p.id !== e.pointerId) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      if (Date.now() - p.t > 900 || Math.abs(dx) < min || Math.abs(dx) < Math.abs(dy) * 1.6) return
      if (dx < 0) onLeft?.(); else onRight?.()
    },
    onPointerCancel: () => { s.current = null },
  }
}
