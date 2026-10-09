import { useEffect, useState } from 'react'

// ساعت دستگاه: کاملاً مستقل از آب‌وهوا/اینترنت؛ بر اساس زمان و منطقهٔ زمانی خود دستگاه و هماهنگ با مرز دقیقه به‌روز می‌شود.
export const msUntilNextMinute = (d: Date) => 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds())

const fmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const formatClock = (d: Date) => fmt.format(d)

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let t: number
    const tick = () => { setNow(new Date()); t = window.setTimeout(tick, msUntilNextMinute(new Date()) + 20) }
    t = window.setTimeout(tick, msUntilNextMinute(new Date()) + 20)
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(new Date()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearTimeout(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  return now
}
