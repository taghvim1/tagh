import { useSyncExternalStore } from 'react'

// تنظیمات کاربر (جز حالت تاریک که در theme.ts است): فقط در localStorage، بدون حساب کاربری یا سرور
const KEY = 'taghvim-settings'
interface Settings { ancientCelebrations: boolean; weatherCard: boolean; dateNotification: boolean; weekHaptics: boolean; worldDays: boolean; religiousDays: boolean; nationalDays: boolean }

const load = (): Settings => {
  try { return { ancientCelebrations: true, weatherCard: true, dateNotification: false, weekHaptics: true, worldDays: true, religiousDays: true, nationalDays: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { ancientCelebrations: true, weatherCard: true, dateNotification: false, weekHaptics: true, worldDays: true, religiousDays: true, nationalDays: true } }
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
const put = (patch: Partial<Settings>) => {
  settings = { ...settings, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* فقط حافظه */ }
  listeners.forEach((l) => l())
}
export const setWorldDays = (value: boolean) => put({ worldDays: value })
export const setReligiousDays = (value: boolean) => put({ religiousDays: value })
export const setNationalDays = (value: boolean) => put({ nationalDays: value })
export const weekHapticsEnabled = () => settings.weekHaptics
export const useWeekHaptics = () => useSyncExternalStore(subscribe, () => settings.weekHaptics, () => settings.weekHaptics)
export const dateNotificationEnabled = () => settings.dateNotification
export const useDateNotification = () => useSyncExternalStore(subscribe, () => settings.dateNotification, () => settings.dateNotification)

/** مناسبت‌ها و آیین‌های باستانی (نوروز، یلدا، سده، گان‌ها …) */
export const showAncientCelebrations = () => settings.ancientCelebrations
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
// دسته‌های مناسبت: هر کدام کلید خاموش/روشن دارد. تعطیلات رسمی هرگز پنهان نمی‌شوند.
/** مناسبت‌های مذهبی (ولادت‌ها، شهادت‌ها، اعیاد) */
export const showReligiousDays = () => settings.religiousDays
/** روزهای جهانی (مثل روز جهانی غذا) */
export const showWorldDays = () => settings.worldDays
/** روزهای ملی غیرتعطیل (مثل روز معلم) */
export const showNationalDays = () => settings.nationalDays
export const useWorldDays = () => useSyncExternalStore(subscribe, showWorldDays, showWorldDays)
export const useReligiousDays = () => useSyncExternalStore(subscribe, showReligiousDays, showReligiousDays)
export const useNationalDays = () => useSyncExternalStore(subscribe, showNationalDays, showNationalDays)
/** کلید یکتا از وضعیت چهار کلید دسته‌ها؛ با هر تغییر، تقویم دوباره رندر می‌شود */
const occasionPrefsKey = () => [settings.religiousDays, settings.ancientCelebrations, settings.worldDays, settings.nationalDays].map((b) => (b ? 1 : 0)).join('')
export const useOccasionPrefs = () => useSyncExternalStore(subscribe, occasionPrefsKey, occasionPrefsKey)
export const useAncientCelebrations = () => useSyncExternalStore(subscribe, showAncientCelebrations, showAncientCelebrations)
export const useWeatherCard = () => useSyncExternalStore(subscribe, () => settings.weatherCard, () => settings.weatherCard)
