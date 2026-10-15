import { useSyncExternalStore } from 'react'

// تنظیمات کاربر (جز حالت تاریک که در theme.ts است): فقط در localStorage، بدون حساب کاربری یا سرور
const KEY = 'taghvim-settings'
interface Settings { ancientCelebrations: boolean; weatherCard: boolean; dateNotification: boolean; weekHaptics: boolean }

const load = (): Settings => {
  try { return { ancientCelebrations: true, weatherCard: true, dateNotification: false, weekHaptics: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { ancientCelebrations: true, weatherCard: true, dateNotification: false, weekHaptics: true } }
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

export function setDateNotificationSetting(value: boolean) {
  settings = { ...settings, dateNotification: value }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}
export function setWeekHaptics(value: boolean) {
  settings = { ...settings, weekHaptics: value }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}
export const weekHapticsEnabled = () => settings.weekHaptics
export const useWeekHaptics = () => useSyncExternalStore(subscribe, () => settings.weekHaptics, () => settings.weekHaptics)
export const dateNotificationEnabled = () => settings.dateNotification
export const useDateNotification = () => useSyncExternalStore(subscribe, () => settings.dateNotification, () => settings.dateNotification)

export const showAncientCelebrations = () => settings.ancientCelebrations
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useAncientCelebrations = () => useSyncExternalStore(subscribe, showAncientCelebrations, showAncientCelebrations)
export const useWeatherCard = () => useSyncExternalStore(subscribe, () => settings.weatherCard, () => settings.weatherCard)
