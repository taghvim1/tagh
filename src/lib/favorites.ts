import { useSyncExternalStore } from 'react'

// علاقه‌مندی‌ها فقط در localStorage (بدون حساب کاربری یا سرور)
export type FavoriteKind = 'destination' | 'tour'
type Store = Record<FavoriteKind, number[]>

const KEY = 'taghvim-favorites'
const listeners = new Set<() => void>()
const load = (): Store => {
  try { return { destination: [], tour: [], ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { destination: [], tour: [] } }
}
let store: Store = load()

export function toggleFavorite(kind: FavoriteKind, id: number) {
  const has = store[kind].includes(id)
  store = { ...store, [kind]: has ? store[kind].filter((x) => x !== id) : [...store[kind], id] }
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}

export const isFavorite = (kind: FavoriteKind, id: number) => store[kind].includes(id)
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useFavorites = () => useSyncExternalStore(subscribe, () => store, () => store)
