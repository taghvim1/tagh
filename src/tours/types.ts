import type { DURATIONS } from '../data/destinations'

export const TOUR_TYPES = ['طبیعت‌گردی', 'ماجراجویی', 'فرهنگی', 'کویر', 'جنگل', 'ساحل', 'شهری'] as const
export const TOUR_BUDGETS = ['اقتصادی', 'متوسط', 'لوکس'] as const
export const DIFFICULTIES = ['آسان', 'متوسط', 'سخت'] as const
export const TOUR_COMPANIONS = ['خانواده', 'زوج', 'دوستان', 'انفرادی'] as const
export type TourStatus = 'upcoming' | 'finished' | 'cancelled'
export const STATUS_LABEL: Record<TourStatus, string> = { upcoming: 'پیش‌رو', finished: 'پایان‌یافته', cancelled: 'لغوشده' }

export interface Tour {
  id: number
  title: string
  destination_id: number
  destination_name: string
  scope: 'domestic' | 'international'
  tour_type: (typeof TOUR_TYPES)[number]
  description: string
  image: string
  /** تاریخ‌ها به شکل ISO میلادی (YYYY-MM-DD)؛ در UI شمسی نمایش داده می‌شوند */
  start_date: string
  end_date: string
  /** از روی تاریخ‌ها محاسبه می‌شود (withDuration) */
  duration: (typeof DURATIONS)[number]
  /** قیمت به تومان */
  price: number
  budget: (typeof TOUR_BUDGETS)[number]
  capacity: number
  remaining_capacity: number
  meeting_point: string
  difficulty: (typeof DIFFICULTIES)[number]
  companions: (typeof TOUR_COMPANIONS)[number][]
  recommended_for: string[]
  included_items: string[]
  excluded_items: string[]
  guide_name: string
  status: TourStatus
  enabled: boolean
}
