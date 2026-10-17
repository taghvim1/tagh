// داده و منطق خالص مناسبت‌ها (بدون وابستگی به UI). فهرست اولیه از همان داده‌ی واقعی تقویم (calendar-data.json) ساخته می‌شود؛
// ویرایش‌های این صفحه فعلاً فقط State محلی است و به برنامه‌ی کاربران نمی‌رسد (در مراحل بعد با API جایگزین می‌شود).
import bundled from '../../../public/data/calendar-data.json'
import { KIND_LABEL, type CalendarData, type OccasionKind } from '../../lib/calendarData'
import { MONTHS, faNum, fromGregorian } from '../../lib/jalali'

export const EVENT_TYPES = ['مذهبی', 'باستانی و آیینی', 'جهانی', 'ملی'] as const
export const EVENT_STATUSES = ['فعال', 'غیرفعال'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]

export interface EventItem {
  id: number
  title: string
  date: string // مثل «۱ فروردین»
  calendar_date: string // مثل «۱۴۰۵/۰۱/۰۱»
  type: EventType
  description: string
  status: EventStatus
}

const TYPE_OF_KIND: Record<OccasionKind, EventType> = { r: 'مذهبی', a: 'باستانی و آیینی', i: 'جهانی', n: 'ملی' }
const pad = (n: number) => faNum(n).padStart(2, '۰')

/** مناسبت‌های یک سال شمسی از داده‌ی تقویم؛ اگر آن سال داده نداشت، آخرین سالِ موجود */
export function buildEvents(data: CalendarData, year: number): EventItem[] {
  const years = Object.keys(data.years ?? {}).map(Number).sort((a, b) => a - b)
  const y = years.includes(year) ? year : years[years.length - 1]
  const out: EventItem[] = []
  if (y === undefined) return out
  for (const [key, list] of Object.entries(data.years![y])) {
    const [month, day] = key.split('-').map(Number)
    for (const [title, kind, holiday] of list) {
      out.push({
        id: out.length + 1, title,
        date: `${faNum(day)} ${MONTHS[month - 1]}`, calendar_date: `${faNum(y)}/${pad(month)}/${pad(day)}`,
        type: TYPE_OF_KIND[kind], description: holiday ? 'تعطیل رسمی' : KIND_LABEL[kind], status: 'فعال',
      })
    }
  }
  return out
}

export const INITIAL_EVENTS: EventItem[] = buildEvents(bundled as unknown as CalendarData, fromGregorian(new Date()).year)

export interface EventFilters {
  query: string
  type: EventType | 'همه'
  status: EventStatus | 'همه'
}

export const DEFAULT_FILTERS: EventFilters = { query: '', type: 'همه', status: 'همه' }

const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()

/** جستجو روی عنوان و توضیحات + فیلتر نوع و وضعیت؛ خروجی بر اساس تاریخ مرتب است. */
export function filterEvents(events: EventItem[], { query, type, status }: EventFilters): EventItem[] {
  const q = normalize(query)
  return events
    .filter((e) => type === 'همه' || e.type === type)
    .filter((e) => status === 'همه' || e.status === status)
    .filter((e) => !q || normalize(e.title).includes(q) || normalize(e.description).includes(q))
    .sort((a, b) => (a.calendar_date < b.calendar_date ? -1 : a.calendar_date > b.calendar_date ? 1 : a.id - b.id))
}
