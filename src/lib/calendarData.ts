import { useSyncExternalStore } from 'react'
import bundled from '../../public/data/calendar-data.json'
import { idbGet, idbSet } from './idb'
import { addNotification } from './notifications'
import { showAncientCelebrations, showNationalDays, showReligiousDays, showWorldDays } from './settings'

// داده‌های تقویم (مناسبت‌ها): Offline-First.
// ۱) فوراً از نسخهٔ همراه برنامه (و در صورت وجود نسخهٔ جدیدتر در IndexedDB از آن) نمایش داده می‌شود.
// ۲) در صورت اتصال، نسخهٔ تازه در پس‌زمینه از /data/calendar-data.json گرفته و با زمان به‌روزرسانی در IndexedDB ذخیره می‌شود.
/** دستهٔ مناسبت: r مذهبی، a باستانی و آیینی، i جهانی، n ملی */
export type OccasionKind = 'r' | 'a' | 'i' | 'n'
export const KIND_LABEL: Record<OccasionKind, string> = { r: 'مذهبی', a: 'باستانی و آیینی', i: 'جهانی', n: 'ملی' }

export interface Occasion {
  title: string; holiday: boolean
  /** دسته (برای مناسبت‌های ثابتِ دستی اختیاری است؛ ancient یعنی دستهٔ باستانی) */
  kind?: OccasionKind
  ancient?: boolean; hypothetical?: boolean
  /** عنوان سایر مناسبت‌های همان روز (عنوان اصلی: تعطیلی، سپس مذهبی، باستانی، ملی، جهانی) */
  more?: string[]
}
/** مناسبت وابسته به سال: [عنوان, دسته, ۱ = تعطیل رسمی] — مناسبت‌های قمری هر سال جابه‌جا می‌شوند */
export type YearEntry = [title: string, kind: OccasionKind, holiday?: 1]
export interface CalendarData {
  version: number
  /** مناسبت‌های ثابتِ دستی (کلید: «ماه-روز») که هر سال تکرار می‌شوند؛ پس از ریست خالی است */
  occasions: Record<string, Occasion>
  /** مناسبت‌های هر سال شمسی (کلید سال، سپس «ماه-روز») — با اسکریپت scripts/import-holidays.mjs ساخته می‌شود */
  years?: Record<string, Record<string, YearEntry[]>>
}
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
  return !!d && typeof d.version === 'number' && !!d.occasions && typeof d.occasions === 'object' && (d.years === undefined || (!!d.years && typeof d.years === 'object'))
}

export interface OccasionItem { title: string; holiday: boolean; kind: OccasionKind; rank: number }
const RANK: Record<OccasionKind, number> = { r: 1, a: 2, n: 3, i: 4 } // تعطیل همیشه rank 0

const visible = (kind: OccasionKind) => (kind === 'r' ? showReligiousDays() : kind === 'a' ? showAncientCelebrations() : kind === 'i' ? showWorldDays() : showNationalDays())

/** همهٔ مناسبت‌های یک روز، به‌ترتیب اهمیت و با اعمال کلیدهای دسته‌ها. تعطیلات رسمی هرگز پنهان نمی‌شوند. */
export const getOccasionList = (month: number, day: number, year?: number, data: CalendarData = snapshot.data): OccasionItem[] => {
  const key = `${month}-${day}`
  const fixed = data.occasions[key]
  const ye = year === undefined ? undefined : data.years?.[year]?.[key]
  const out: OccasionItem[] = []
  const add = (title: string, holiday: boolean, kind: OccasionKind) => { if (!out.some((o) => o.title === title)) out.push({ title, holiday, kind, rank: holiday ? 0 : RANK[kind] }) }
  for (const [title, kind, h] of ye ?? []) add(title, h === 1, kind)
  if (fixed) add(fixed.title, fixed.holiday, fixed.kind ?? (fixed.ancient ? 'a' : 'n'))
  return out.filter((c) => c.holiday || visible(c.kind)).sort((a, b) => a.rank - b.rank)
}

export const getOccasion = (month: number, day: number, year?: number): Occasion | undefined => {
  const list = getOccasionList(month, day, year)
  if (!list.length) return undefined
  const [first, ...rest] = list
  return { title: first.title, holiday: list.some((c) => c.holiday), kind: first.kind, ...(rest.length ? { more: rest.map((c) => c.title) } : {}) }
}

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
