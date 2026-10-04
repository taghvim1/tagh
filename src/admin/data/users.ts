// داده‌های Mock کاربران؛ در مراحل بعد با داده‌های واقعی جایگزین می‌شود.
export const USER_STATUSES = ['مهمان', 'عضو'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export interface UserItem {
  id: number
  name: string
  status: UserStatus
  city: string
  last_activity: string
}

export const MOCK_USERS: UserItem[] = [
  { id: 1, name: 'علی رضایی', status: 'عضو', city: 'تهران', last_activity: 'امروز، ۱۰:۲۰' },
  { id: 2, name: 'مریم احمدی', status: 'عضو', city: 'اصفهان', last_activity: 'دیروز' },
  { id: 3, name: 'کاربر مهمان ۱۰۲', status: 'مهمان', city: 'شیراز', last_activity: '۲ ساعت پیش' },
  { id: 4, name: 'حسین کریمی', status: 'عضو', city: 'مشهد', last_activity: '۳ روز پیش' },
  { id: 5, name: 'زهرا محمدی', status: 'عضو', city: 'تبریز', last_activity: 'امروز، ۰۸:۴۵' },
  { id: 6, name: 'کاربر مهمان ۱۰۷', status: 'مهمان', city: 'رشت', last_activity: '۵ دقیقه پیش' },
  { id: 7, name: 'سارا حسینی', status: 'عضو', city: 'کرمان', last_activity: 'هفتهٔ پیش' },
  { id: 8, name: 'رضا نوری', status: 'مهمان', city: 'تهران', last_activity: 'دیروز' },
  { id: 9, name: 'نرگس صادقی', status: 'عضو', city: 'اهواز', last_activity: '۲ روز پیش' },
  { id: 10, name: 'کاربر مهمان ۱۱۵', status: 'مهمان', city: 'یزد', last_activity: '۱ ساعت پیش' },
]

export interface UserFilters {
  query: string
  status: UserStatus | 'همه'
}

export const DEFAULT_USER_FILTERS: UserFilters = { query: '', status: 'همه' }

const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()

/** جستجو روی نام و شهر + فیلتر وضعیت */
export function filterUsers(users: UserItem[], { query, status }: UserFilters): UserItem[] {
  const q = normalize(query)
  return users
    .filter((u) => status === 'همه' || u.status === status)
    .filter((u) => !q || normalize(u.name).includes(q) || normalize(u.city).includes(q))
}
