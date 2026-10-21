import { useSyncExternalStore } from 'react'
import { fetchJob } from './client'
import type { PackageInput, TourPackage } from './types'

// کارهای طراحیِ در جریان روی همین دستگاه ثبت می‌شوند؛ طراحی خودش روی سرور انجام می‌شود، پس بستن برنامه آن را متوقف نمی‌کند.
export interface LocalJob { id: string; input: PackageInput; status: 'pending' | 'done' | 'failed'; created_at: number; package?: TourPackage; error?: string; seen?: boolean }
const KEY = 'taghvim-package-jobs-v1', MAX = 8, EXPIRE = 48 * 3600_000
const listeners = new Set<() => void>()
const load = (): LocalJob[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v.filter((j: LocalJob) => Date.now() - j.created_at < EXPIRE) : [] } catch { return [] } }
let jobs: LocalJob[] = load()
const commit = (next: LocalJob[]) => { jobs = next.slice(0, MAX); try { localStorage.setItem(KEY, JSON.stringify(jobs)) } catch { /* فقط حافظه */ } listeners.forEach((l) => l()) }

export const addJob = (id: string, input: PackageInput) => commit([{ id, input, status: 'pending', created_at: Date.now() }, ...jobs])
export const removeJob = (id: string) => commit(jobs.filter((j) => j.id !== id))
export const markSeen = (id: string) => commit(jobs.map((j) => (j.id === id ? { ...j, seen: true } : j)))
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useJobs = () => useSyncExternalStore(subscribe, () => jobs, () => jobs)
export const getJobs = () => jobs

async function notifyLocal(j: LocalJob, ok: boolean) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return
    const reg = await navigator.serviceWorker?.ready; if (!reg) return
    await reg.showNotification(ok ? 'پکیج تور آماده شد' : 'طراحی پکیج ناموفق بود', { body: ok ? `${j.input.origin} ← ${j.input.destination}، ${j.input.days} روز` : 'دوباره امتحان کنید.', tag: `pkg-${j.id}`, icon: '/icons/icon-192.png', dir: 'rtl', lang: 'fa', data: { url: `/package?job=${j.id}` } })
  } catch { /* بدون اعلان */ }
}

let timer: number | undefined, busy = false
async function tick() {
  if (busy) return; busy = true
  try {
    for (const j of jobs.filter((x) => x.status === 'pending')) {
      const r = await fetchJob(j.id)
      if (r.status === 'offline' || r.status === 'pending') continue
      const next: LocalJob = r.status === 'done' ? { ...j, status: 'done', package: r.package } : { ...j, status: 'failed', error: r.status === 'failed' ? r.error : 'gone' }
      commit(jobs.map((x) => (x.id === j.id ? next : x)))
      void notifyLocal(next, r.status === 'done')
    }
  } finally { busy = false }
}
/** با باز شدن برنامه شروع می‌شود و کارهای در جریان را هر چند ثانیه می‌پرسد (در صورت قطع اینترنت بعداً ادامه می‌دهد). */
export function startJobPoller() {
  if (timer !== undefined || typeof window === 'undefined') return
  const run = () => { if (jobs.some((j) => j.status === 'pending')) void tick() }
  timer = window.setInterval(run, 3000); run()
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run() })
}
