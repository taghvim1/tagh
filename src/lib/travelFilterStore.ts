import { EMPTY_FILTERS, type TravelFilters } from '../travel/filters'

// آخرین فیلترهای انتخاب‌شده؛ فقط در حافظه، تا با رفتن به صفحهٔ جزئیات و برگشتن پاک نشوند.
let saved: TravelFilters = EMPTY_FILTERS

export const getSavedFilters = () => saved
export const saveFilters = (filters: TravelFilters) => { saved = filters }
