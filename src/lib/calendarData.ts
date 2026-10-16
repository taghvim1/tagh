import { useSyncExternalStore } from 'react'
import bundled from '../../public/data/calendar-data.json'
import { idbGet, idbSet } from './idb'
import { addNotification } from './notifications'
import { showAncientCelebrations, showWorldDays } from './settings'

// داده‌های تقویم (مناسبت‌ها): Offline-First.
// ۱) فوراً از نسخهٔ همراه برنامه (و در صورت وجود نسخهٔ جدیدتر در IndexedDB از آن) نمایش داده می‌شود.
// ۲) در صورت اتصال، نسخهٔ تازه در پس‌زمینه از /data/calendar-data.json گرفته و با زمان به‌روزرسانی در IndexedDB ذخیره می‌شود.
export interface Occasion {
  title: string; holiday: boolean; hypothetical?: boolean
  /** آیین یا جشن باستانی؛ با خاموش‌بودن تنظیم مربوط پنهان می‌شود (تعطیلات رسمی هرگز پنهان نمی‌شوند) */
  ancient?: boolean
  /** عنوان سایر مناسبت‌های همان روز (عنوان اصلی: تعطیلی، سپس مذهبی، باستانی، ملی، جهانی) */
  more?: string[]
}
/** مناسبت وابسته به سال: [عنوان, نوع (r مذهبی، n ملی، i جهانی), ۱ = تعطیل رسمی] — مناسبت‌های قمری هر سال جابه‌جا می‌شوند */
export type YearEntry = [title: string, kind: 'r' | 'n' | 'i', holiday?: 1]
export interface CalendarData {
  version: number
  /** مناسبت‌های ثابت (کلید: «ماه-روز») که هر سال تکرار می‌شوند */
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

export interface OccasionItem { title: string; holiday: boolean; rank: number; ancient?: boolean; hypothetical?: boolean }
const RANK = { holiday: 0, religious: 1, ancient: 2, national: 3, hypothetical: 4, international: 5 } as const

/** همهٔ مناسبت‌های یک روز، به‌ترتیب اهمیت و با اعمال تنظیمات کاربر. اگر سال داده شود، مناسبت‌های همان سال هم در نظر گرفته می‌شود. */
export const getOccasionList = (month: number, day: number, year?: number, data: CalendarData = snapshot.data): OccasionItem[] => {
  const key = `${month}-${day}`
  const fixed = data.occasions[key]
  const ye = year === undefined ? undefined : data.years?.[year]?.[key]
  const out: OccasionItem[] = []
  const add = (c: OccasionItem) => { if (!out.some((o) => o.title === c.title)) out.push(c) }
  for (const [title, kind, h] of ye ?? []) add({ title, holiday: h === 1, rank: h === 1 ? RANK.holiday : kind === 'r' ? RANK.religious : kind === 'n' ? RANK.national : RANK.international })
  if (fixed) {
    // اگر داده‌ی همان سال برای این روز هست، مناسبت ثابتِ معمولی کنار می‌رود (داده‌ی سال معتبرتر است)؛ تعطیلیِ ثابت فقط وقتی که سال تعطیلی ندارد
    const keep = !ye?.length || fixed.ancient || fixed.hypothetical || (fixed.holiday && !ye.some((e) => e[2] === 1))
    if (keep) add({ title: fixed.title, holiday: fixed.holiday, ancient: fixed.ancient, hypothetical: fixed.hypothetical, rank: fixed.holiday ? RANK.holiday : fixed.ancient ? RANK.ancient : fixed.hypothetical ? RANK.hypothetical : RANK.national })
  }
  const ancientOn = showAncientCelebrations(), worldOn = showWorldDays()
  return out
    .filter((c) => c.holiday || ((ancientOn || !c.ancient) && (worldOn || (c.rank !== RANK.national && c.rank !== RANK.international))))
    .sort((a, b) => a.rank - b.rank)
}

export const getOccasion = (month: number, day: number, year?: number): Occasion | undefined => {
  const list = getOccasionList(month, day, year)
  if (!list.length) return undefined
  const [first, ...rest] = list
  return {
    title: first.title, holiday: list.some((c) => c.holiday),
    ...(first.ancient ? { ancient: true } : {}), ...(first.hypothetical ? { hypothetical: true } : {}),
    ...(rest.length ? { more: rest.map((c) => c.title) } : {}),
  }
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
