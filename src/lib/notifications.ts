import { useSyncExternalStore } from 'react'

// اعلان‌های داخل برنامه (محلی)؛ در localStorage نگه‌داری می‌شوند و بدون سرور یا Push کار می‌کنند.
export interface AppNotification { id: string; title: string; text: string; time: number; read: boolean }

const KEY = 'taghvim-notifications'
const MAX = 20
const listeners = new Set<() => void>()

function load(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
let items: AppNotification[] = load()

function commit(next: AppNotification[]) {
  items = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ذخیره‌سازی در دسترس نیست */ }
  listeners.forEach((l) => l())
}

export const addNotification = (n: { title: string; text: string }) =>
  commit([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: Date.now(), read: false, ...n }, ...items].slice(0, MAX))

export const markAllRead = () => { if (items.some((n) => !n.read)) commit(items.map((n) => ({ ...n, read: true }))) }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useNotifications = () => useSyncExternalStore(subscribe, () => items, () => items)
