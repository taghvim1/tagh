import { useSyncExternalStore } from 'react'
import { TRIP_TYPES, type ChecklistCategory, type TripType, type IconKey } from '../checklist/templates'

// چک‌لیست سفر: فقط روی همین دستگاه (localStorage)؛ بدون اینترنت هم کامل کار می‌کند.
// برای هر نوع سفر: تیک‌ها، آیتم‌ها/دسته‌های افزودهٔ کاربر. نوع‌های ساخته‌شدهٔ کاربر هم همین‌جا ذخیره می‌شود.
const KEY = 'taghvim-checklists-v1'
export interface CustomType { id: string; title: string; hue: number; icon: IconKey }
export interface ChecklistState {
  custom: CustomType[]
  checked: Record<string, Record<string, true>>
  extra: Record<string, ChecklistCategory[]> // افزودهٔ کاربر؛ دستهٔ هم‌نام دستهٔ آماده (id یکسان) به همان دسته اضافه می‌شود
}
const EMPTY: ChecklistState = { custom: [], checked: {}, extra: {} }
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export function sanitize(raw: unknown): ChecklistState {
  if (!isObj(raw)) return EMPTY
  const str = (v: unknown, max = 80): v is string => typeof v === 'string' && v.trim() !== '' && v.length <= max
  const custom = (Array.isArray(raw.custom) ? raw.custom : []).flatMap((c): CustomType[] => isObj(c) && str(c.id, 40) && str(c.title) ? [{ id: c.id as string, title: (c.title as string).trim(), hue: Number(c.hue) || 200, icon: 'star' }] : []).slice(0, 40)
  const checked: ChecklistState['checked'] = {}
  if (isObj(raw.checked)) for (const [t, m] of Object.entries(raw.checked)) if (isObj(m)) checked[t] = Object.fromEntries(Object.keys(m).map((k) => [k, true as const]))
  const extra: ChecklistState['extra'] = {}
  if (isObj(raw.extra)) for (const [t, cats] of Object.entries(raw.extra)) {
    if (!Array.isArray(cats)) continue
    extra[t] = cats.flatMap((c): ChecklistCategory[] => isObj(c) && str(c.id, 60) && str(c.title) && Array.isArray(c.items)
      ? [{ id: c.id as string, title: (c.title as string).trim(), items: (c.items as unknown[]).flatMap((i) => isObj(i) && str(i.id, 60) && str(i.text, 200) ? [{ id: i.id as string, text: (i.text as string).trim(), mine: true }] : []) }] : [])
  }
  return { custom, checked, extra }
}

let state = (() => { try { return sanitize(JSON.parse(localStorage.getItem(KEY) ?? 'null')) } catch { return EMPTY } })()
const listeners = new Set<() => void>()
const commit = (next: ChecklistState) => {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useChecklists = () => useSyncExternalStore(subscribe, () => state, () => state)

// ---- توابع خالص (برای تست) ----
export const allTypes = (s: ChecklistState): TripType[] => [...TRIP_TYPES, ...s.custom.map((c): TripType => ({ ...c, categories: [], custom: true }))]
export const findType = (s: ChecklistState, id: string) => allTypes(s).find((t) => t.id === id)

/** دسته‌های آماده + افزودهٔ کاربر (آیتم‌های دستهٔ هم‌شناسه به انتهای همان دسته می‌روند؛ دستهٔ تازه آخر می‌آید) */
export function categoriesOf(s: ChecklistState, type: TripType): ChecklistCategory[] {
  const extra = s.extra[type.id] ?? []
  const base = type.categories.map((c) => ({ ...c, items: [...c.items, ...(extra.find((e) => e.id === c.id)?.items ?? [])] }))
  return [...base, ...extra.filter((e) => !type.categories.some((c) => c.id === e.id) && e.items.length > 0)]
}
export const progressOf = (s: ChecklistState, type: TripType) => {
  const items = categoriesOf(s, type).flatMap((c) => c.items), done = items.filter((i) => s.checked[type.id]?.[i.id]).length
  return { done, total: items.length }
}

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const clean = (t: string) => t.replace(/\s+/g, ' ').trim()

export function toggled(s: ChecklistState, typeId: string, itemId: string): ChecklistState {
  const cur = { ...(s.checked[typeId] ?? {}) }
  if (cur[itemId]) delete cur[itemId]; else cur[itemId] = true
  return { ...s, checked: { ...s.checked, [typeId]: cur } }
}
/** افزودن آیتم: به دستهٔ موجود (catId) یا دستهٔ تازه (newTitle). متن خالی = بدون تغییر. */
export function withItem(s: ChecklistState, type: TripType, text: string, target: { catId: string } | { newTitle: string }): ChecklistState {
  const t = clean(text); if (!t) return s
  const cats = categoriesOf(s, type)
  let catId: string, title: string
  if ('catId' in target) {
    const c = cats.find((x) => x.id === target.catId); if (!c) return s
    catId = c.id; title = c.title
  } else {
    const nt = clean(target.newTitle); if (!nt) return s
    const same = cats.find((x) => x.title === nt)
    catId = same?.id ?? uid('x'); title = nt
  }
  const list = (s.extra[type.id] ?? []).map((c) => ({ ...c, items: [...c.items] }))
  let slot = list.find((c) => c.id === catId)
  if (!slot) { slot = { id: catId, title, items: [] }; list.push(slot) }
  slot.items.push({ id: uid('u'), text: t.slice(0, 200), mine: true })
  return { ...s, extra: { ...s.extra, [type.id]: list } }
}
export function withoutItem(s: ChecklistState, typeId: string, itemId: string): ChecklistState {
  const list = (s.extra[typeId] ?? []).map((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) })).filter((c) => c.items.length > 0)
  const checked = { ...(s.checked[typeId] ?? {}) }; delete checked[itemId]
  return { ...s, extra: { ...s.extra, [typeId]: list }, checked: { ...s.checked, [typeId]: checked } }
}
export const withoutChecks = (s: ChecklistState, typeId: string): ChecklistState => ({ ...s, checked: { ...s.checked, [typeId]: {} } })
/** نوع سفر تازه؛ copyFrom = شناسهٔ نوعی که دسته‌ها و آیتم‌هایش به‌عنوان نقطهٔ شروع کپی شود */
export function withType(s: ChecklistState, title: string, hue: number, copyFrom?: string): { state: ChecklistState; id: string } {
  const id = uid('c'), name = clean(title).slice(0, 40)
  const src = copyFrom ? findType(s, copyFrom) : undefined
  const cats = src ? categoriesOf(s, src).map((c) => ({ id: c.id, title: c.title, items: c.items.map((i, k) => ({ id: uid('u') + k, text: i.text, mine: true })) })) : []
  return { id, state: { ...s, custom: [...s.custom, { id, title: name, hue, icon: 'star' }], extra: { ...s.extra, [id]: cats } } }
}
export function withoutType(s: ChecklistState, id: string): ChecklistState {
  const { [id]: _c, ...checked } = s.checked; const { [id]: _e, ...extra } = s.extra
  return { custom: s.custom.filter((c) => c.id !== id), checked, extra }
}

// ---- عمل‌ها ----
export const toggleItem = (typeId: string, itemId: string) => commit(toggled(state, typeId, itemId))
export const addItem = (type: TripType, text: string, target: { catId: string } | { newTitle: string }) => commit(withItem(state, type, text, target))
export const removeItem = (typeId: string, itemId: string) => commit(withoutItem(state, typeId, itemId))
export const resetChecks = (typeId: string) => commit(withoutChecks(state, typeId))
export function createType(title: string, hue: number, copyFrom?: string): string | null {
  if (!clean(title)) return null
  const r = withType(state, title, hue, copyFrom); commit(r.state); return r.id
}
export const deleteType = (id: string) => commit(withoutType(state, id))
