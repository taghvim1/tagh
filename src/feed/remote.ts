import { useSyncExternalStore } from 'react'
import { isFresh, markFetched } from '../lib/throttle'
import { isFeedKind, type FeedKind } from './topics'

// کارت‌های امروز («آیا می‌دانستید» و موضوع‌های کاشی صفحهٔ دوم) از سرور. Offline-First: آخرین نتیجهٔ موفق در localStorage می‌ماند؛
// بدون سرور/اینترنت همان نمایش داده می‌شود و برنامه هرگز منتظر آن نمی‌ماند.
export interface FeedItem {
  id: number; kind: FeedKind; title: string; body: string; place?: string
  facts: { label: string; value: string }[]
  image: { url: string; attribution: string | null; source_url: string | null; license: string | null; author: string | null }
  sources: { title: string; url: string }[]
  published_date: string
}
export interface FeedSnapshot { date: string; items: Partial<Record<FeedKind, FeedItem>> }

const KEY = 'taghvim-feed-v1'
const REFRESH_FEED_MS = 15 * 60_000 // کارت‌های روز؛ در همان روز و کمتر از ۱۵ دقیقه دوباره پرسیده نمی‌شود
const EMPTY: FeedSnapshot = { date: '', items: {} }
const https = (u: unknown): u is string => typeof u === 'string' && /^https:\/\//i.test(u)
const http = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u)
const str = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** فقط شکل مورد انتظار پذیرفته می‌شود (آدرس‌ها https/http، متن‌ها رشته)؛ هر مورد نامعتبر کنار گذاشته می‌شود. */
export function sanitizeFeed(raw: unknown): FeedSnapshot {
  const r = raw as { date?: unknown; items?: Record<string, unknown> } | null
  if (!r || typeof r !== 'object' || !r.items || typeof r.items !== 'object') return EMPTY
  const items: FeedSnapshot['items'] = {}
  for (const [k, v] of Object.entries(r.items)) {
    const it = v as Partial<FeedItem> | null
    if (!isFeedKind(k) || !it || !str(it.title) || !str(it.body) || !it.image || !https(it.image.url)) continue
    items[k] = {
      id: Number(it.id) || 0, kind: k, title: it.title, body: it.body, ...(str(it.place) ? { place: it.place } : {}),
      facts: (Array.isArray(it.facts) ? it.facts : []).filter((f) => f && str(f.label) && str(f.value)).slice(0, 6).map((f) => ({ label: f.label, value: f.value })),
      image: { url: it.image.url, attribution: str(it.image.attribution) ? it.image.attribution : null, source_url: http(it.image.source_url) ? it.image.source_url : null, license: str(it.image.license) ? it.image.license : null, author: str(it.image.author) ? it.image.author : null },
      sources: (Array.isArray(it.sources) ? it.sources : []).filter((s) => s && str(s.title) && http(s.url)).slice(0, 10).map((s) => ({ title: s.title, url: s.url })),
      published_date: str(it.published_date) ? it.published_date : '',
    }
  }
  return { date: str(r.date) ? r.date : '', items }
}

function read(): FeedSnapshot { try { return sanitizeFeed(JSON.parse(localStorage.getItem(KEY) ?? 'null')) } catch { return EMPTY } }

let snap = read()
let started = false
const listeners = new Set<() => void>()

export async function refreshFeed(fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<boolean> {
  try {
    const res = await fetchImpl('/api/feed', { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return false // مثلاً هاست فقط‌-ایستا که index.html برمی‌گرداند
    snap = sanitizeFeed(await res.json()); markFetched('feed')
    try { localStorage.setItem(KEY, JSON.stringify(snap)) } catch { /* فقط حافظه */ }
    listeners.forEach((l) => l()); return true
  } catch { return false }
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  if (!started) {
    started = true; if (!isFresh('feed', REFRESH_FEED_MS)) void refreshFeed()
    // بازگشت به برنامه (مثلاً روز بعد) یا برگشتن اینترنت ⇒ کارت‌های تازهٔ امروز
    window.addEventListener('online', () => { if (!isFresh('feed', REFRESH_FEED_MS)) void refreshFeed() })
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !isFresh('feed', REFRESH_FEED_MS)) void refreshFeed() })
  }
  return () => { listeners.delete(l) }
}
export const useFeed = (): FeedSnapshot => useSyncExternalStore(subscribe, () => snap, () => EMPTY)
