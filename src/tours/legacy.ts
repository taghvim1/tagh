// انتقال تورهای ذخیره‌شدهٔ نسخهٔ قبلی (کلید taghvim-tours-v1) به ساختار جدید؛ داده‌ای حذف نمی‌شود.
import { withDuration } from './logic'
import type { Tour } from './types'

interface LegacyTour {
  id: number; title: string; destination_id: number; destination_name: string; scope: Tour['scope']; tour_type: Tour['tourType']
  description: string; image: string; start_date: string; end_date: string; price: number; budget: Tour['budget']; capacity: number
  remaining_capacity: number; meeting_point: string; difficulty: Tour['difficulty']; companions: Tour['suitableFor']; recommended_for: string[]
  included_items: string[]; excluded_items: string[]; guide_name: string; status: 'upcoming' | 'finished' | 'cancelled'; enabled: boolean
}

export const styleOf = (type: Tour['tourType']): Tour['travelStyle'] =>
  type === 'ساحل' ? 'آرام و استراحتی' : type === 'فرهنگی' || type === 'شهری' ? 'گشت و فرهنگی' : type === 'ماجراجویی' ? 'ماجراجویانه' : 'پرتحرک'

/** تورهای قدیمی برگزارکنندهٔ مشخصی نداشتند؛ به برگزارکنندهٔ شمارهٔ ۱ وصل می‌شوند و از پنل مدیریت قابل تغییرند. */
export function migrateLegacyTours(): Tour[] | null {
  try {
    const raw = localStorage.getItem('taghvim-tours-v1')
    if (!raw) return null
    const old = JSON.parse(raw) as LegacyTour[]
    if (!Array.isArray(old)) return null
    return old.map((o) => withDuration({
      id: o.id, title: o.title, organizerId: 1, destinationId: o.destination_id, destinationName: o.destination_name, image: o.image,
      shortDescription: o.description, fullDescription: o.description, startDate: o.start_date, endDate: o.end_date, price: o.price,
      capacity: o.capacity, remainingCapacity: o.remaining_capacity, tourType: o.tour_type, scope: o.scope, duration: 'یک روزه', budget: o.budget,
      difficulty: o.difficulty, travelStyle: styleOf(o.tour_type), suitableFor: o.companions ?? [], services: o.included_items ?? [], itinerary: [],
      conditions: (o.excluded_items ?? []).map((x) => `شامل نمی‌شود: ${x}`), meetingPoint: o.meeting_point, guideName: o.guide_name,
      contact: '', registrationLink: '', active: o.enabled && o.status !== 'cancelled',
    }))
  } catch { return null }
}
