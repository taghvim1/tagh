import { useCallback, useState } from 'react'

const KEY = 'taghvim-theme'

/** حالت تاریک؛ ذخیره در localStorage (با محافظت در برابر خطا) */
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(KEY) === 'dark' } catch { return false }
  })
  const update = useCallback((value: boolean) => {
    setDark(value)
    try { localStorage.setItem(KEY, value ? 'dark' : 'light') } catch { /* ذخیره‌سازی در دسترس نیست */ }
  }, [])
  return [dark, update] as const
}
