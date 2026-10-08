// داده‌های نمونهٔ برگزارکنندگان (Mock)؛ از پنل مدیریت قابل ویرایش‌اند.
import type { TourOrganizer } from './types'

export const seedOrganizers = (): TourOrganizer[] => [
  { id: 1, name: 'کاروان سبز', logo: '', description: 'برگزاری تورهای طبیعت‌گردی و کویر‌نوردی با راهنمایان محلی.', city: 'تهران', phone: '', website: '', instagram: '', active: true },
  { id: 2, name: 'سفرنگ', logo: '', description: 'تورهای فرهنگی و شهری داخلی و خارجی.', city: 'اصفهان', phone: '', website: '', instagram: '', active: true },
  { id: 3, name: 'پارسه‌گردان', logo: '', description: 'تورهای کوتاه آخر هفته و سفرهای ساحلی.', city: 'شیراز', phone: '', website: '', instagram: '', active: true },
]
