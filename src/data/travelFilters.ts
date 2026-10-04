// گزینه‌ها و منطق خالص فیلترهای پیشنهاد سفر (بدون موتور پیشنهاد و بدون داده‌های واقعی مقصد)
export const TRIP_TYPES = ['طبیعت‌گردی', 'تاریخی و فرهنگی', 'ماجراجویی', 'شهری', 'ساحلی', 'کویر'] as const
export const DURATIONS = ['یک روزه', '۲ تا ۳ روز', '۴ تا ۷ روز', 'بیش از یک هفته'] as const
export const BUDGETS = ['اقتصادی', 'متوسط', 'راحت', 'لوکس'] as const

export interface TravelFilters {
  destination: string
  type: string // رشتهٔ خالی = انتخاب نشده
  duration: string
  budget: string
}

export const EMPTY_FILTERS: TravelFilters = { destination: '', type: '', duration: '', budget: '' }

/** خلاصهٔ فیلترهای انتخاب‌شده به شکل [برچسب، مقدار]؛ موارد خالی حذف می‌شوند. */
export function summarize(f: TravelFilters): [string, string][] {
  const rows: [string, string][] = [['مقصد', f.destination.trim()], ['نوع سفر', f.type], ['مدت سفر', f.duration], ['بودجه', f.budget]]
  return rows.filter(([, value]) => value !== '')
}
