import { createLocalRepository, useRepository } from '../lib/localRepository'
import { seedOrganizers } from './data'
import type { TourOrganizer } from './types'

// منبع داده برگزارکنندگان (فعلاً Local)؛ مستقل از تورها و مقصدها. برای API فقط همین رابط جایگزین می‌شود.
export const organizerRepo = createLocalRepository<TourOrganizer>('taghvim-tour-organizers-v1', seedOrganizers)
export const useOrganizers = () => useRepository(organizerRepo)
export const findOrganizer = (list: TourOrganizer[], id: number) => list.find((o) => o.id === id)
