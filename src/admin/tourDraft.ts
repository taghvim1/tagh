import type { Destination } from '../data/destinations'
import { parseISO, withDuration } from '../tours/logic'
import { DIFFICULTIES, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, type Tour, type TourStatus } from '../tours/types'
import { lines, num } from './components/fields'

export interface TourDraft {
  title: string; destination_id: string; scope: Tour['scope']; tour_type: Tour['tour_type']; image: string; description: string
  start_date: string; end_date: string; price: string; budget: Tour['budget']; capacity: string; remaining_capacity: string
  meeting_point: string; difficulty: Tour['difficulty']; companions: string[]; recommended_for: string; included_items: string; excluded_items: string
  guide_name: string; status: TourStatus; enabled: boolean
}

export const toTourDraft = (t?: Tour): TourDraft =>
  t
    ? { title: t.title, destination_id: String(t.destination_id), scope: t.scope, tour_type: t.tour_type, image: t.image, description: t.description, start_date: t.start_date, end_date: t.end_date, price: String(t.price), budget: t.budget, capacity: String(t.capacity), remaining_capacity: String(t.remaining_capacity), meeting_point: t.meeting_point, difficulty: t.difficulty, companions: t.companions, recommended_for: t.recommended_for.join('\n'), included_items: t.included_items.join('\n'), excluded_items: t.excluded_items.join('\n'), guide_name: t.guide_name, status: t.status, enabled: t.enabled }
    : { title: '', destination_id: '', scope: 'domestic', tour_type: TOUR_TYPES[0], image: '', description: '', start_date: '', end_date: '', price: '', budget: TOUR_BUDGETS[1], capacity: '', remaining_capacity: '', meeting_point: '', difficulty: DIFFICULTIES[0], companions: [], recommended_for: '', included_items: '', excluded_items: '', guide_name: '', status: 'upcoming', enabled: true }

export type TourResult = { ok: true; value: Tour } | { ok: false; errors: string[] }

export function fromTourDraft(f: TourDraft, id: number, destinations: Destination[]): TourResult {
  const errors: string[] = []
  const dest = destinations.find((d) => String(d.id) === f.destination_id)
  if (!f.title.trim()) errors.push('عنوان تور الزامی است.')
  if (!dest) errors.push('مقصد را انتخاب کنید.')
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime())
  if (!validDate(f.start_date) || !validDate(f.end_date)) errors.push('تاریخ شروع و پایان را وارد کنید.')
  else if (f.end_date < f.start_date) errors.push('تاریخ پایان نمی‌تواند قبل از شروع باشد.')
  const [price, capacity, remaining] = [num(f.price), num(f.capacity), num(f.remaining_capacity)]
  if (Number.isNaN(price) || price < 0) errors.push('قیمت باید عددی معتبر باشد.')
  if (!Number.isInteger(capacity) || capacity < 1) errors.push('ظرفیت باید عددی صحیح و حداقل ۱ باشد.')
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > capacity) errors.push('ظرفیت باقی‌مانده باید بین ۰ و ظرفیت کل باشد.')
  if (errors.length || !dest) return { ok: false, errors }
  return {
    ok: true,
    value: withDuration({
      id, title: f.title.trim(), destination_id: dest.id, destination_name: dest.name, scope: f.scope, tour_type: f.tour_type,
      description: f.description.trim(), image: f.image.trim() || dest.image, start_date: f.start_date, end_date: f.end_date, duration: 'یک روزه',
      price, budget: f.budget, capacity, remaining_capacity: remaining, meeting_point: f.meeting_point.trim(), difficulty: f.difficulty,
      companions: f.companions.filter((c): c is (typeof TOUR_COMPANIONS)[number] => (TOUR_COMPANIONS as readonly string[]).includes(c)),
      recommended_for: lines(f.recommended_for), included_items: lines(f.included_items), excluded_items: lines(f.excluded_items),
      guide_name: f.guide_name.trim(), status: f.status, enabled: f.enabled,
    }),
  }
}

