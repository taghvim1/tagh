import type { AccountMergeLog, AccountStatus, ActivityEvent, ConsentSummary, InterestScore, NotificationPreferences, UserState } from '../types'

/** رکورد کامل یک پروفایل (مهمان یا ثبت‌نام‌شده) در سمت سرور. */
export interface ProfileRecord {
  id: string // user_id برای حساب، anonymous_id برای مهمان
  anonymous_ids: string[]
  status: AccountStatus
  state: UserState
  display_name?: string
  country?: string
  province?: string
  city?: string
  first_seen_at: string
  registered_at?: string
  last_active_at: string
  events: ActivityEvent[]
  favorites: { destination: number[]; tour: number[] }
  interests: InterestScore[]
  consent: ConsentSummary
  notifications: NotificationPreferences
  contact?: { email?: string; phone?: string }
  merge_logs: AccountMergeLog[]
}

/** نمای فهرست: بدون اطلاعات تماس */
export interface UserSummary {
  id: string
  status: AccountStatus
  state: UserState
  display_name?: string
  city?: string
  first_seen_at: string
  last_active_at: string
  sessions: number
  destinations_viewed: number
  top_interests: string[]
  event_count: number
}
export interface UserDetail extends UserSummary {
  country?: string; province?: string; registered_at?: string
  anonymous_ids: string[]
  favorites: ProfileRecord['favorites']
  interests: InterestScore[]
  consent: ConsentSummary
  notifications: NotificationPreferences
  merge_logs: AccountMergeLog[]
  seasons: Record<string, number>
  viewed_destinations: Array<{ id: number; views: number; approx_seconds: number }>
  viewed_tours: number[]
  filters_used: Record<string, number>
  offer_clicks: number
  contact?: { email?: string; phone?: string }
}
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
