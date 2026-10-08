import { createLocalRepository, useRepository } from '../lib/localRepository'
import { migrateLegacyTours } from './legacy'
import { seedTours } from './data'
import type { Tour } from './types'

// منبع داده تورها (فعلاً Local)، مستقل از مقصدها و پیشنهاد سفر.
// اگر کاربر از نسخهٔ قبلی داده‌ای ذخیره کرده باشد، همان تورها به ساختار جدید منتقل می‌شوند.
export const tourRepo = createLocalRepository<Tour>('taghvim-tours-v2', () => migrateLegacyTours() ?? seedTours())
export const useTours = () => useRepository(tourRepo)
export const findTour = (list: Tour[], id: number) => list.find((t) => t.id === id)
