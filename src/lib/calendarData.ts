import { useSyncExternalStore } from 'react'
import bundled from '../../public/data/calendar-data.json'
import { idbGet, idbSet } from './idb'
import { addNotification } from './notifications'

// داده‌های تقویم (مناسبت‌ها): Offline-First.
// ۱) فوراً از نسخهٔ همراه برنامه (و در صورت وجود نسخهٔ جدیدتر در IndexedDB از آن) نمایش داده می‌شود.
// ۲) در صورت اتصال، نسخهٔ تازه در پس‌زمینه از /data/calendar-data.json گرفته و با زمان به‌روزرسانی در IndexedDB ذخیره می‌شود.
export interface Occasion { title: string; holiday: boolean; hypothetical?: boolean }
export interface CalendarData { version: number; occasions: Record<string, Occasion> }
interface Snapshot { data: CalendarData; updatedAt: number | null }

const KEY = 'calendar-data'
const DEFAULT = bundled as unknown as CalendarData

let snapshot: Snapshot = { data: DEFAULT, updatedAt: null }
const listeners = new Set<() => void>()
const publish = (data: CalendarData, updatedAt: number | null) => {
  snapshot = { data, updatedAt }
  listeners.forEach((l) => l())
}

const isValid = (x: unknown): x is CalendarData => {
  const d = x as CalendarData | null
  return !!d && typeof d.version === 'number' && !!d.occasions && typeof d.occasions === 'object'
}

export const getOccasion = (month: number, day: number): Occasion | undefined => snapshot.data.occasions[`${month}-${day}`]

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useCalendarData = () => useSyncExternalStore(subscribe, () => snapshot, () => snapshot)

async function save(data: CalendarData): Promise<number> {
  const updatedAt = Date.now()
  try { await idbSet(KEY, { data, updatedAt }) } catch { /* IndexedDB در دسترس نیست؛ فقط حافظه */ }
  return updatedAt
}

async function refresh() {
  if (!navigator.onLine) return
  try {
    const res = await fetch('/data/calendar-data.json', { cache: 'no-cache' })
    if (!res.ok) return
    const next: unknown = await res.json()
    if (!isValid(next) || next.version <= snapshot.data.version) return
    publish(next, await save(next))
    addNotification({ title: 'داده‌های تقویم به‌روزرسانی شد', text: 'آخرین نسخهٔ داده‌ها دریافت و روی دستگاه ذخیره شد.' })
  } catch { /* آفلاین یا پاسخ نامعتبر: نسخهٔ محلی معتبر می‌ماند */ }
}

export async function initCalendarData() {
  try {
    const stored = await idbGet<{ data: CalendarData; updatedAt: number }>(KEY)
    if (stored && isValid(stored.data) && stored.data.version >= DEFAULT.version) publish(stored.data, stored.updatedAt)
    else publish(DEFAULT, await save(DEFAULT))
  } catch { /* بدون IndexedDB: نسخهٔ همراه برنامه */ }
  window.addEventListener('online', refresh)
  void refresh()
}
