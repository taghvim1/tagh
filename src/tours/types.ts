import type { DURATIONS } from '../data/destinations'

export const TOUR_TYPES = ['طبیعت‌گردی', 'ماجراجویی', 'فرهنگی', 'کویر', 'جنگل', 'ساحل', 'شهری'] as const
export const TOUR_BUDGETS = ['اقتصادی', 'متوسط', 'لوکس'] as const
export const DIFFICULTIES = ['آسان', 'متوسط', 'سخت'] as const
export const TOUR_COMPANIONS = ['خانواده', 'زوج', 'دوستان', 'انفرادی'] as const
export const TRAVEL_STYLES = ['آرام و استراحتی', 'گشت و فرهنگی', 'پرتحرک', 'ماجراجویانه'] as const

export interface Tour {
  id: number
  title: string
  organizerId: number
  destinationId: number
  destinationName: string
  image: string
  shortDescription: string
  fullDescription: string
  /** تاریخ‌ها به شکل ISO میلادی (YYYY-MM-DD)؛ در UI شمسی نمایش داده می‌شوند */
  startDate: string
  endDate: string
  /** قیمت به تومان */
  price: number
  capacity: number
  remainingCapacity: number
  tourType: (typeof TOUR_TYPES)[number]
  scope: 'domestic' | 'international'
  /** از روی تاریخ‌ها محاسبه می‌شود (withDuration) */
  duration: (typeof DURATIONS)[number]
  budget: (typeof TOUR_BUDGETS)[number]
  difficulty: (typeof DIFFICULTIES)[number]
  travelStyle: (typeof TRAVEL_STYLES)[number]
  suitableFor: (typeof TOUR_COMPANIONS)[number][]
  /** خدمات شامل تور */
  services: string[]
  /** برنامهٔ سفر؛ هر مورد یک روز/مرحله */
  itinerary: string[]
  /** شرایط و موارد شامل‌نشدن */
  conditions: string[]
  meetingPoint: string
  guideName: string
  /** اطلاعات تماس (تلفن یا راه ارتباطی) */
  contact: string
  registrationLink: string
  active: boolean
}
