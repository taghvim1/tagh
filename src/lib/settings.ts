import { useSyncExternalStore } from 'react'

// تنظیمات کاربر (جز حالت تاریک که در theme.ts است): فقط در localStorage، بدون حساب کاربری یا سرور
const KEY = 'taghvim-settings'
interface Settings { ancientCelebrations: boolean; weatherCard: boolean }

const load = (): Settings => {
  try { return { ancientCelebrations: true, weatherCard: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { ancientCelebrations: true, weatherCard: true } }
}
let settings: Settings = load()
const listeners = new Set<() => void>()

export function setAncientCelebrations(value: boolean) {
  settings = { ...settings, ancientCelebrations: value }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}

export function setWeatherCard(value: boolean) {
  settings = { ...settings, weatherCard: value }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}

export const showAncientCelebrations = () => settings.ancientCelebrations
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useAncientCelebrations = () => useSyncExternalStore(subscribe, showAncientCelebrations, showAncientCelebrations)
export const useWeatherCard = () => useSyncExternalStore(subscribe, () => settings.weatherCard, () => settings.weatherCard)
