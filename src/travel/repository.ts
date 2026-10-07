import { MOCK_DESTINATIONS, type Destination } from '../data/destinations'
import { createLocalRepository, useRepository } from '../lib/localRepository'

// منبع داده مقصدها (فعلاً Local). نسخهٔ کلید با تغییر ساختار داده بالا می‌رود.
export const destinationRepo = createLocalRepository<Destination>('taghvim-destinations-v2', () => MOCK_DESTINATIONS)
export const useDestinations = () => useRepository(destinationRepo)
export const findDestination = (list: Destination[], id: number) => list.find((d) => d.id === id)
