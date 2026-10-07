import { createLocalRepository, useRepository } from '../lib/localRepository'
import { seedTours } from './data'
import type { Tour } from './types'

// منبع داده تورها (فعلاً Local)؛ تا قبل از اولین تغییر مدیر، تاریخ‌های نمونه نسبت به امروز ساخته می‌شوند.
export const tourRepo = createLocalRepository<Tour>('taghvim-tours-v1', () => seedTours())
export const useTours = () => useRepository(tourRepo)
