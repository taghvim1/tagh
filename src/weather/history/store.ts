// ذخیره و انتشار داده‌های تاریخی: نتایج در IndexedDB با کلید «weather-update» (نام آب‌وهوا آپدیت) می‌مانند
// و هنگام باز شدن برنامه دوباره دریافت نمی‌شوند؛ فقط مقصدهای جدید/قدیمی همگام می‌شوند.
import { useSyncExternalStore } from 'react'
import { faNum } from '../../lib/jalali'
import { idbGet, idbSet } from '../../lib/idb'
import { addNotification } from '../../lib/notifications'
import { destinationRepo } from '../../travel/repository'
import { syncHistoricalWeather } from './sync'
import type { DestinationClimate } from './types'

const KEY = 'weather-update'
const FAIL_KEY = 'taghvim-weather-failures'
const RETRY_AFTER_MS = 6 * 3600_000
export const UPDATE_TITLE = 'آب‌وهوا آپدیت'

let entries: Record<number, DestinationClimate> = {}
const listeners = new Set<() => void>()
const publish = (next: Record<number, DestinationClimate>) => { entries = next; listeners.forEach((l) => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const useHistoricalClimate = () => useSyncExternalStore(subscribe, () => entries, () => entries)

const loadFailures = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(FAIL_KEY) ?? '{}') } catch { return {} } }
const saveFailures = (f: Record<string, number>) => { try { localStorage.setItem(FAIL_KEY, JSON.stringify(f)) } catch { /* فقط حافظه */ } }

let running = false

/** یک‌بار هنگام شروع (و با برگشتن اینترنت)؛ هم‌زمان فقط یک اجرا و بدون حلقهٔ درخواست */
export async function syncHistoricalClimate() {
  if (running || (typeof navigator !== 'undefined' && navigator.onLine === false)) return
  running = true
  try {
    const failures = loadFailures()
    const { entries: next, report } = await syncHistoricalWeather(destinationRepo.getAll(), entries, {
      skip: (id) => Date.now() - (failures[id] ?? 0) < RETRY_AFTER_MS,
    })
    const now = Date.now()
    for (const f of report.failed) failures[f.id] = now
    for (const id of report.fetched) delete failures[id]
    saveFailures(failures)
    if (report.fetched.length > 0) {
      try { await idbSet(KEY, next) } catch { /* بدون IndexedDB: فقط در حافظهٔ همین اجرا */ }
      publish(next)
      addNotification({ title: UPDATE_TITLE, text: `داده‌های آب‌وهوای ${faNum(report.fetched.length)} مقصد ذخیره شد.` })
    }
    return report
  } finally { running = false }
}

export async function initHistoricalClimate() {
  try {
    const stored = await idbGet<Record<number, DestinationClimate>>(KEY)
    if (stored && typeof stored === 'object') publish(stored)
  } catch { /* بدون IndexedDB */ }
  window.addEventListener('online', () => void syncHistoricalClimate())
  setTimeout(() => void syncHistoricalClimate(), 3000) // بعد از نمایش صفحهٔ اصلی، تا بارگذاری اولیه کند نشود
}
