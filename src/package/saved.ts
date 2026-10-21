import { useSyncExternalStore } from 'react'
import type { TourPackage } from './types'

// پکیج‌های ذخیره‌شده (علاقه‌مندی) فقط روی همین دستگاه می‌مانند
const KEY = 'taghvim-saved-packages-v1', MAX = 30
const listeners = new Set<() => void>()
const load = (): TourPackage[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
let list: TourPackage[] = load()
const commit = (next: TourPackage[]) => { list = next; try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* فقط حافظه */ } listeners.forEach((l) => l()) }

export const isPackageSaved = (id: string) => list.some((p) => p.id === id)
export const savePackage = (p: TourPackage) => { if (!isPackageSaved(p.id)) commit([p, ...list].slice(0, MAX)) }
export const removePackage = (id: string) => commit(list.filter((p) => p.id !== id))
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useSavedPackages = () => useSyncExternalStore(subscribe, () => list, () => list)
