import { useEffect, useState } from 'react'
import { MOCK_DESTINATIONS } from '../data/destinations'
import { safeKV } from './ids'
import { createTracker } from './tracker'
import type { EventProps } from './tracker'

const standalone = typeof window !== 'undefined' && !!window.matchMedia?.('(display-mode: standalone)').matches
/** تنها نمونهٔ ردیاب برنامه. تا زمانی که کاربر «تحلیل ناشناس» را روشن نکرده چیزی ثبت نمی‌شود و بدون بک‌اند چیزی ارسال نمی‌شود. */
export const tracker = createTracker({ kv: safeKV(), platform: standalone ? 'pwa' : 'web' })

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
  else { const m = path.match(/^\/tours\/(\d+)$/); if (m) tracker.track('view_tour', { tour_id: Number(m[1]) }) }
}
