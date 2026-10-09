// همگام‌سازی داده‌های تاریخی مقصدها: فقط مقصدهای فاقد/قدیمی، با محدودیت هم‌زمانی، تلاش مجدد و گزارش خطا.
import { SEED_COORDINATES, type Destination } from '../../data/destinations'
import { WeatherError } from '../codes'
import { analyzeSeries } from './analyze'
import { fetchArchive, historyRange } from './client'
import type { DailySeries, DestinationClimate } from './types'

export interface SyncReport {
  fetched: number[]
  cached: number[]
  failed: { id: number; kind: string }[]
  /** مقصدهای بدون مختصات؛ مختصات مقصد دیگری جایگزین نمی‌شود */
  missingCoordinates: { id: number; name: string }[]
}

export interface SyncDeps {
  fetchSeries?: (lat: number, lon: number, start: string, end: string) => Promise<DailySeries>
  now?: () => Date
  sleep?: (ms: number) => Promise<void>
  concurrency?: number
  retries?: number
  /** مقصدی که اخیراً شکست خورده و نباید دوباره تلاش شود (جلوگیری از حلقهٔ درخواست) */
  skip?: (id: number) => boolean
}

const validCoord = (n: unknown, lim: number): n is number => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= lim
/** مختصات خود مقصد؛ برای مقصدهای ذخیره‌شدهٔ قدیمی فقط مختصات همان شناسه و همان نام از دادهٔ اولیه (نه مقصد دیگر) */
export function coordinatesOf(d: Pick<Destination, 'id' | 'name' | 'latitude' | 'longitude'>): { lat: number; lon: number } | null {
  if (validCoord(d.latitude, 90) && validCoord(d.longitude, 180)) return { lat: d.latitude, lon: d.longitude }
  const seed = SEED_COORDINATES[d.id]
  return seed && seed.name === d.name ? { lat: seed.latitude, lon: seed.longitude } : null
}

export async function syncHistoricalWeather(destinations: Destination[], existing: Record<number, DestinationClimate>, deps: SyncDeps = {}) {
  const now = deps.now?.() ?? new Date()
  const range = historyRange(now)
  const fetchSeries = deps.fetchSeries ?? ((la, lo, s, e) => fetchArchive(la, lo, s, e))
  const sleep = deps.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)))
  const retries = deps.retries ?? 2
  const entries: Record<number, DestinationClimate> = { ...existing }
  const report: SyncReport = { fetched: [], cached: [], failed: [], missingCoordinates: [] }

  const todo: { d: Destination; lat: number; lon: number }[] = []
  for (const d of destinations.filter((x) => x.enabled)) {
    const c = coordinatesOf(d)
    if (!c) { report.missingCoordinates.push({ id: d.id, name: d.name }); continue }
    const cur = entries[d.id]
    if (cur && cur.latitude === c.lat && cur.longitude === c.lon && cur.rangeEnd === range.end) { report.cached.push(d.id); continue }
    if (deps.skip?.(d.id)) continue
    todo.push({ d, ...c })
  }

  async function one({ d, lat, lon }: (typeof todo)[number]) {
    for (let attempt = 0; ; attempt++) {
      try {
        const stats = analyzeSeries(await fetchSeries(lat, lon, range.start, range.end))
        entries[d.id] = { destinationId: d.id, destinationName: d.name, latitude: lat, longitude: lon, rangeStart: range.start, rangeEnd: range.end, fetchedAt: now.getTime(), stats }
        report.fetched.push(d.id)
        return
      } catch (e) {
        const err = e instanceof WeatherError ? e : new WeatherError('network', 'خطای نامشخص', true)
        if (!err.retriable || attempt >= retries) { report.failed.push({ id: d.id, kind: err.kind }); return }
        await sleep((err.kind === 'rate' ? 5000 : 1000) * 3 ** attempt)
      }
    }
  }

  // صف ساده با تعداد کارگر محدود (پیش‌فرض ۲)
  const queue = [...todo]
  const worker = async () => { for (let t = queue.shift(); t; t = queue.shift()) await one(t) }
  await Promise.all(Array.from({ length: Math.min(deps.concurrency ?? 2, queue.length) }, worker))
  return { entries, report }
}
