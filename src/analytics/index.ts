import { useEffect, useState } from 'react'
import { MOCK_DESTINATIONS } from '../data/destinations'
import { safeKV } from './ids'
import { createHttpTransport } from './httpTransport'
import { createTracker } from './tracker'
import { skipTelemetry } from '../lib/internal'
import type { EventProps } from './tracker'

const standalone = typeof window !== 'undefined' && !!window.matchMedia?.('(display-mode: standalone)').matches
/** تنها نمونهٔ ردیاب برنامه. پیش‌فرض روشن (قابل خاموش‌کردن)؛ همه‌چیز اول روی دستگاه ذخیره می‌شود و با اتصال به سرور ارسال می‌شود. */
export const tracker = createTracker({ kv: safeKV(), transport: createHttpTransport(), platform: standalone ? 'pwa' : 'web', isDisabled: skipTelemetry })

export function useAnalytics() {
  const read = () => ({ consent: tracker.consent(), pending: tracker.pending(), deletion: tracker.deletionRequest(), id: tracker.installation().anonymous_id })
  const [s, set] = useState(read)
  useEffect(() => tracker.subscribe(() => set(read())), [])
  return s
}

const destMeta = (id: number): EventProps => {
  const d = MOCK_DESTINATIONS.find((x) => x.id === id)
  return d ? { destination_id: d.id, category: d.type[0], budget_range: d.budget, domestic_or_international: d.scope } : { destination_id: id }
}
export const trackDestinationView = (id: number, season?: string) => tracker.track('view_destination', { ...destMeta(id), season })
export const trackFavorite = (kind: 'destination' | 'tour', id: number, added: boolean) =>
  tracker.track(added ? 'favorite_add' : 'favorite_remove', kind === 'destination' ? destMeta(id) : { tour_id: id })
export const trackSeason = (season: string) => tracker.track('select_season', { season })

/** نگاشت مسیرهای برنامه به رویداد (فقط نوع صفحه، نه اطلاعات کاربر) */
export function trackRoute(path: string) {
  if (path === '/') tracker.track('view_calendar')
  else if (path === '/travel-suggestions') tracker.track('view_suggestions')
  else if (path === '/tours') tracker.track('view_tours')
  else if (path === '/settings') tracker.track('feature_use', { category: 'settings' })
  else if (path === '/favorites') tracker.track('feature_use', { category: 'favorites' })
  else if (path === '/notes') tracker.track('feature_use', { category: 'notes' })
  else { const m = path.match(/^\/tours\/(\d+)$/); if (m) tracker.track('view_tour', { tour_id: Number(m[1]) }) }
}

/** ارسال خودکار: هنگام بازگشت اینترنت، دیده‌شدن دوبارهٔ برنامه و هر ۶۰ ثانیه (فقط وقتی چیزی در صف است). بدون حلقهٔ بی‌رویه: عقب‌نشینی نمایی در flush. */
export function startAutoFlush(target: Pick<Window, 'addEventListener'> & { document?: Document } = window) {
  const go = (force = false) => { if (navigator.onLine !== false && !document.hidden) void tracker.flush({ force }) }
  target.addEventListener('online', () => go(true))
  document.addEventListener('visibilitychange', () => go())
  window.setInterval(() => go(), 60_000)
  go()
}
