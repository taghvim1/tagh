import { useSyncExternalStore } from 'react'
import type { JalaliDate } from './jalali'

// یادداشت‌های روزها: فقط روی همین دستگاه (localStorage)؛ کلید = تاریخ شمسی. متن خالی = حذف یادداشت.
const KEY = 'taghvim-notes'
const load = (): Record<string, string> => {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} }
}
let notes = load()
const listeners = new Set<() => void>()

export const noteKey = (d: JalaliDate) => `${d.year}-${d.month}-${d.day}`
export const getNote = (key: string) => notes[key] ?? ''

export function setNote(key: string, text: string) {
  const next = { ...notes }
  if (text.trim()) next[key] = text; else delete next[key]
  notes = next
  try { localStorage.setItem(KEY, JSON.stringify(notes)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useNotes = () => useSyncExternalStore(subscribe, () => notes, () => notes)
