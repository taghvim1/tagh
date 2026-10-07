import { useSyncExternalStore } from 'react'

// لایهٔ دادهٔ ساده و آمادهٔ API: UI فقط از این Repository می‌خواند/می‌نویسد.
// برای اتصال به سرور کافی است همین رابط با پیاده‌سازی HTTP جایگزین شود.
export interface Repository<T extends { id: number }> {
  getAll(): T[]
  setAll(items: T[]): void
  upsert(item: T): void
  remove(id: number): void
  subscribe(listener: () => void): () => void
}

/** داده فقط پس از اولین تغییر (مثلاً توسط مدیر) در localStorage نوشته می‌شود؛ تا آن زمان از seed خوانده می‌شود */
export function createLocalRepository<T extends { id: number }>(key: string, seed: () => T[]): Repository<T> {
  let cache: T[] | null = null
  const listeners = new Set<() => void>()
  const read = (): T[] => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw) as T[]
    } catch { /* ذخیره‌سازی در دسترس نیست */ }
    return seed()
  }
  const getAll = () => (cache ??= read())
  const setAll = (items: T[]) => {
    cache = items
    try { localStorage.setItem(key, JSON.stringify(items)) } catch { /* فقط حافظه */ }
    listeners.forEach((l) => l())
  }
  return {
    getAll,
    setAll,
    upsert: (item) => { const all = getAll(); setAll(all.some((x) => x.id === item.id) ? all.map((x) => (x.id === item.id ? item : x)) : [...all, item]) },
    remove: (id) => setAll(getAll().filter((x) => x.id !== id)),
    subscribe: (l) => { listeners.add(l); return () => { listeners.delete(l) } },
  }
}

export const useRepository = <T extends { id: number }>(repo: Repository<T>) => useSyncExternalStore(repo.subscribe, repo.getAll, repo.getAll)
export const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((i) => i.id)) + 1
