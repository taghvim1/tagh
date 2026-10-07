import type { Season } from '../data/destinations'
import { EMPTY_FILTERS, type TravelFilters } from '../travel/filters'

// آخرین انتخاب‌های صفحهٔ پیشنهاد سفر؛ فقط در حافظه، تا با رفتن به صفحهٔ جزئیات و برگشتن پاک نشوند.
// season فقط وقتی معتبر است که فصلِ مبتنی بر تاریخ تقویم (baseSeason) از آن زمان تغییر نکرده باشد.
interface Saved { filters: TravelFilters; season: Season | null; baseSeason: Season | null }

let saved: Saved = { filters: EMPTY_FILTERS, season: null, baseSeason: null }

export const getSaved = () => saved
export const saveState = (patch: Partial<Saved>) => { saved = { ...saved, ...patch } }
