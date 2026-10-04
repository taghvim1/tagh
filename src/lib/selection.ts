import { useSyncExternalStore } from 'react'
import type { JalaliDate } from './jalali'

// روز انتخاب‌شده در تقویم؛ فقط در حافظه. صفحه‌هایی که از آن استفاده می‌کنند با هر تغییر بلافاصله به‌روز می‌شوند.
let selectedDate: JalaliDate | null = null
const listeners = new Set<() => void>()

export const getSelectedDate = () => selectedDate

export function setSelectedDate(date: JalaliDate) {
  selectedDate = date
  listeners.forEach((l) => l())
}

export function subscribeSelectedDate(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const useSelectedDate = () => useSyncExternalStore(subscribeSelectedDate, getSelectedDate, () => null)
