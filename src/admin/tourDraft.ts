import type { Destination } from '../data/destinations'
import type { TourOrganizer } from '../tour-organizers/types'
import { parseISO, withDuration } from '../tours/logic'
import { DIFFICULTIES, TOUR_BUDGETS, TOUR_COMPANIONS, TOUR_TYPES, TRAVEL_STYLES, type Tour } from '../tours/types'
import { lines, num } from './components/fields'

export interface TourDraft {
  title: string; organizerId: string; destinationId: string; scope: Tour['scope']; tourType: Tour['tourType']; image: string
  shortDescription: string; fullDescription: string; startDate: string; endDate: string; price: string; budget: Tour['budget']
  capacity: string; remainingCapacity: string; meetingPoint: string; difficulty: Tour['difficulty']; travelStyle: Tour['travelStyle']
  suitableFor: string[]; services: string; itinerary: string; conditions: string; guideName: string; contact: string; registrationLink: string; active: boolean
}

export const toTourDraft = (t?: Tour): TourDraft =>
  t
    ? { title: t.title, organizerId: String(t.organizerId), destinationId: String(t.destinationId), scope: t.scope, tourType: t.tourType, image: t.image, shortDescription: t.shortDescription, fullDescription: t.fullDescription, startDate: t.startDate, endDate: t.endDate, price: String(t.price), budget: t.budget, capacity: String(t.capacity), remainingCapacity: String(t.remainingCapacity), meetingPoint: t.meetingPoint, difficulty: t.difficulty, travelStyle: t.travelStyle, suitableFor: t.suitableFor, services: t.services.join('\n'), itinerary: t.itinerary.join('\n'), conditions: t.conditions.join('\n'), guideName: t.guideName, contact: t.contact, registrationLink: t.registrationLink, active: t.active }
    : { title: '', organizerId: '', destinationId: '', scope: 'domestic', tourType: TOUR_TYPES[0], image: '', shortDescription: '', fullDescription: '', startDate: '', endDate: '', price: '', budget: TOUR_BUDGETS[1], capacity: '', remainingCapacity: '', meetingPoint: '', difficulty: DIFFICULTIES[0], travelStyle: TRAVEL_STYLES[0], suitableFor: [], services: '', itinerary: '', conditions: '', guideName: '', contact: '', registrationLink: '', active: true }

export type TourResult = { ok: true; value: Tour } | { ok: false; errors: string[] }

export function fromTourDraft(f: TourDraft, id: number, destinations: Destination[], organizers: TourOrganizer[]): TourResult {
  const errors: string[] = []
  const dest = destinations.find((d) => String(d.id) === f.destinationId)
  const org = organizers.find((o) => String(o.id) === f.organizerId)
  if (!f.title.trim()) errors.push('عنوان تور الزامی است.')
  if (!org) errors.push('برگزارکننده را انتخاب کنید.')
  if (!dest) errors.push('مقصد را انتخاب کنید.')
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime())
  if (!validDate(f.startDate) || !validDate(f.endDate)) errors.push('تاریخ شروع و پایان را وارد کنید.')
  else if (f.endDate < f.startDate) errors.push('تاریخ پایان نمی‌تواند قبل از شروع باشد.')
  const [price, capacity, remaining] = [num(f.price), num(f.capacity), num(f.remainingCapacity)]
  if (Number.isNaN(price) || price < 0) errors.push('قیمت باید عددی معتبر باشد.')
  if (!Number.isInteger(capacity) || capacity < 1) errors.push('ظرفیت باید عددی صحیح و حداقل ۱ باشد.')
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > capacity) errors.push('ظرفیت باقی‌مانده باید بین ۰ و ظرفیت کل باشد.')
  if (errors.length || !dest || !org) return { ok: false, errors }
  const short = f.shortDescription.trim()
  return {
    ok: true,
    value: withDuration({
      id, title: f.title.trim(), organizerId: org.id, destinationId: dest.id, destinationName: dest.name, image: f.image.trim() || dest.image,
      shortDescription: short, fullDescription: f.fullDescription.trim() || short, startDate: f.startDate, endDate: f.endDate, price, capacity,
      remainingCapacity: remaining, tourType: f.tourType, scope: f.scope, duration: 'یک روزه', budget: f.budget, difficulty: f.difficulty,
      travelStyle: f.travelStyle, suitableFor: f.suitableFor.filter((c): c is (typeof TOUR_COMPANIONS)[number] => (TOUR_COMPANIONS as readonly string[]).includes(c)),
      services: lines(f.services), itinerary: lines(f.itinerary), conditions: lines(f.conditions), meetingPoint: f.meetingPoint.trim(),
      guideName: f.guideName.trim(), contact: f.contact.trim(), registrationLink: f.registrationLink.trim(), active: f.active,
    }),
  }
}
