// داده‌های Mock و منطق خالص مناسبت‌ها (بدون وابستگی به UI). در مراحل بعد با API جایگزین می‌شود.
export const EVENT_TYPES = ['ملی', 'مذهبی', 'فرهنگی', 'بین‌المللی'] as const
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

export const MOCK_EVENTS: EventItem[] = [
  { id: 1, title: 'نوروز', date: '۱ فروردین', calendar_date: '۱۴۰۵/۰۱/۰۱', type: 'ملی', description: 'آغاز سال نو', status: 'فعال' },
  { id: 2, title: 'روز طبیعت', date: '۱۳ فروردین', calendar_date: '۱۴۰۵/۰۱/۱۳', type: 'ملی', description: 'روز طبیعت', status: 'فعال' },
  { id: 3, title: 'روز معلم', date: '۱۲ اردیبهشت', calendar_date: '۱۴۰۵/۰۲/۱۲', type: 'فرهنگی', description: 'روز گرامیداشت مقام معلم', status: 'فعال' },
  { id: 4, title: 'روز جهانی محیط زیست', date: '۱۵ خرداد', calendar_date: '۱۴۰۵/۰۳/۱۵', type: 'بین‌المللی', description: 'روز جهانی محیط زیست', status: 'فعال' },
  { id: 5, title: 'شب یلدا', date: '۳۰ آذر', calendar_date: '۱۴۰۵/۰۹/۳۰', type: 'فرهنگی', description: 'بلندترین شب سال', status: 'فعال' },
  { id: 6, title: 'روز دانشجو', date: '۱۶ آذر', calendar_date: '۱۴۰۵/۰۹/۱۶', type: 'فرهنگی', description: 'روز دانشجو', status: 'فعال' },
  { id: 7, title: 'روز جهانی گردشگری', date: '۵ مهر', calendar_date: '۱۴۰۵/۰۷/۰۵', type: 'بین‌المللی', description: 'روز جهانی گردشگری', status: 'فعال' },
  { id: 8, title: 'روز خبرنگار', date: '۱۷ مرداد', calendar_date: '۱۴۰۵/۰۵/۱۷', type: 'فرهنگی', description: 'روز خبرنگار', status: 'فعال' },
  { id: 9, title: 'روز جمهوری اسلامی', date: '۱۲ فروردین', calendar_date: '۱۴۰۵/۰۱/۱۲', type: 'ملی', description: 'روز جمهوری اسلامی ایران', status: 'فعال' },
  { id: 10, title: 'روز جهانی کوهستان', date: '۲۰ آذر', calendar_date: '۱۴۰۵/۰۹/۲۰', type: 'بین‌المللی', description: 'روز جهانی کوهستان', status: 'فعال' },
  // دو نمونهٔ آزمایشی برای تست فیلتر «مذهبی» و «غیرفعال»؛ تاریخ‌ها واقعی نیستند.
  { id: 11, title: 'مناسبت مذهبی نمونه', date: '۱ تیر', calendar_date: '۱۴۰۵/۰۴/۰۱', type: 'مذهبی', description: 'نمونهٔ آزمایشی برای نمایش نوع مذهبی', status: 'فعال' },
  { id: 12, title: 'مناسبت آزمایشی', date: '۱۰ بهمن', calendar_date: '۱۴۰۵/۱۱/۱۰', type: 'فرهنگی', description: 'نمونهٔ آزمایشی غیرفعال', status: 'غیرفعال' },
]

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
