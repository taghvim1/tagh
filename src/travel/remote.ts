import { useMemo, useSyncExternalStore } from 'react'
import type { Destination } from '../data/destinations'
import { contentToDestination, REMOTE_ID_BASE, type PublicSuggestion } from './suggestionContent'
import { useDestinations } from './repository'

// پیشنهادهای منتشرشده از سرور. بدون سرور/اینترنت، آخرین نتیجهٔ موفق (کش محلی) یا هیچ‌چیز؛ برنامه هرگز منتظر آن نمی‌ماند.
const KEY = 'taghvim-remote-suggestions-v1'
let items: Destination[] = read()
let started = false
const listeners = new Set<() => void>()

function read(): Destination[] { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
export function toRemoteDestinations(list: PublicSuggestion[]): Destination[] {
  return list.map((s) => contentToDestination(s.content, REMOTE_ID_BASE + s.id, s.image.url, [s.image.attribution, s.image.license].filter(Boolean).join(' · ') || undefined))
}
export async function refreshRemoteSuggestions(fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<boolean> {
  try {
    const res = await fetchImpl('/api/travel-suggestions', { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return false // مثلاً هاست فقط‌-ایستا که index.html برمی‌گرداند
    const body = (await res.json()) as { items?: PublicSuggestion[] }
    if (!Array.isArray(body.items)) return false
    items = toRemoteDestinations(body.items)
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* فقط حافظه */ }
    listeners.forEach((l) => l()); return true
  } catch { return false }
}
const subscribe = (l: () => void) => { listeners.add(l); if (!started) { started = true; void refreshRemoteSuggestions() } return () => { listeners.delete(l) } }
const useRemote = () => useSyncExternalStore(subscribe, () => items, () => items)

/** مقصدهای قابل‌نمایش برای کاربر: محلی + منتشرشدهٔ سرور (بدون تکرار شناسه) */
export function useAllDestinations(): Destination[] {
  const local = useDestinations(), remote = useRemote()
  return useMemo(() => [...local, ...remote.filter((r) => !local.some((l) => l.id === r.id))], [local, remote])
}
