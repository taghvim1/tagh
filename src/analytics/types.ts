// مدل داده (۱۰ موجودیت). این‌ها قراردادِ مشترک کلاینت و سرور آینده‌اند؛ همهٔ زمان‌ها ISO-8601 به UTC.
export type ISODate = string
export type AccountStatus = 'guest' | 'registered'
export type UserState = 'active' | 'disabled' | 'deleted'

/** ۱) users — فقط روی سرور واقعی معنا دارد (کلاینت هرگز فهرست کاربران را نگه نمی‌دارد) */
export interface UserRecord {
  user_id: string
  display_name?: string
  username?: string
  /** حساس: فقط با مجوز users.view_contact و با ثبت در audit log */
  email?: string
  phone?: string
  email_verified?: boolean
  phone_verified?: boolean
  registered_at: ISODate
  last_login_at?: ISODate
  state: UserState
  language?: string
  country?: string
  province?: string
  /** شهرِ انتخاب‌شده توسط کاربر (نه موقعیت GPS) */
  city?: string
  timezone?: string
  profile_updated_at?: ISODate
}

/** ۲) anonymous_installations */
export interface AnonymousInstallation {
  anonymous_id: string
  user_id?: string
  account_status: AccountStatus
  first_seen_at: ISODate
  last_seen_at: ISODate
  created_at: ISODate
  updated_at: ISODate
  app_version: string
  platform: 'web' | 'pwa'
  consent_status: ConsentSummary
}

/** ۳) user_sessions */
export interface UserSession {
  session_id: string
  anonymous_id: string
  user_id?: string
  started_at: ISODate
  last_event_at: ISODate
  event_count: number
}

export const EVENT_TYPES = [
  'app_open', 'view_calendar', 'view_season', 'select_season', 'view_suggestions', 'view_destination',
  'destination_dwell', 'favorite_add', 'favorite_remove', 'search', 'use_filter', 'select_budget',
  'select_travel_style', 'select_scope', 'view_tours', 'view_tour', 'view_organizer', 'offer_click',
  'notification_open', 'feature_use', 'settings_change', 'technical_error',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

/** ۴) activity_events — فقط فیلدهای مرتبط هر رویداد پر می‌شود */
export interface ActivityEvent {
  event_id: string
  anonymous_id: string
  user_id?: string
  event_type: EventType
  occurred_at: ISODate
  session_id: string
  destination_id?: number
  tour_id?: number
  organizer_id?: number
  season?: string
  category?: string
  budget_range?: string
  travel_style?: string
  domestic_or_international?: 'domestic' | 'international'
  /** نام فیلترهای استفاده‌شده (نه متن آزاد کاربر) */
  filters?: string[]
  /** تقریبی؛ معادل توجه واقعی نیست */
  duration_sec?: number
  /** برای search فقط طول عبارت ثبت می‌شود، نه متن */
  query_length?: number
  /** برای خطا فقط نام/کد کوتاه، بدون stack و اطلاعات کاربر */
  error_code?: string
  app_version: string
  platform: 'web' | 'pwa'
  consent_context: ConsentSummary
}

export const INTEREST_DIMENSIONS = ['type', 'season', 'style', 'budget', 'scope', 'duration'] as const
export type InterestDimension = (typeof INTEREST_DIMENSIONS)[number]

/** ۵) user_preferences — ترجیحات صریح کاربر؛ قابل اصلاح و حذف توسط خود کاربر */
export interface UserPreferences {
  subject_id: string
  /** کلیدهای dimension:value که کاربر خودش انتخاب کرده */
  explicit_interests: string[]
  /** استنباط‌هایی که کاربر حذف کرده و دیگر نباید برگردند */
  hidden_interests: string[]
  favorites: { destination: number[]; tour: number[] }
  updated_at: ISODate
}

/** ۶) user_interest_scores */
export interface InterestScore {
  interest_key: string
  dimension: InterestDimension
  value: string
  score: number
  /** ۰..۱؛ با تعداد شواهد بالا می‌رود. یک بازدید به‌تنهایی اطمینان پایینی دارد */
  confidence: number
  source: 'explicit' | 'inferred'
  last_interaction_at: ISODate
  supporting_event_count: number
  updated_at: ISODate
}

export type ConsentKind = 'analytics' | 'marketing' | 'location'
export type ConsentSummary = Record<ConsentKind, boolean>

/** ۷) consent_records — فقط‌الحاقی؛ آخرین رکورد هر نوع وضعیت جاری است */
export interface ConsentRecord {
  consent_id: string
  subject_id: string
  kind: ConsentKind
  granted: boolean
  recorded_at: ISODate
  policy_version: string
  source: 'settings' | 'prompt' | 'server'
}

/** ۸) account_merge_logs — فقط شمارش و کد؛ بدون محتوای رویداد */
export interface AccountMergeLog {
  merge_id: string
  user_id: string
  anonymous_id: string
  status: 'success' | 'already_merged' | 'rejected' | 'failed'
  reason_code?: string
  events_linked: number
  events_skipped_duplicates: number
  favorites_added: number
  created_at: ISODate
}

/** ۹) notification_preferences */
export interface NotificationPreferences {
  subject_id: string
  /** اعلان‌های ضروری عملیاتی (امنیت، وضعیت حساب) جدا از تبلیغات است */
  operational: boolean
  promotional: boolean
  unsubscribed_at?: ISODate
  last_promotional_sent_at?: ISODate
  updated_at: ISODate
}

/** ۱۰) admin_audit_logs */
export interface AdminAuditLog {
  audit_id: string
  admin_id: string
  role: string
  action: 'view_contact' | 'export' | 'disable_user' | 'delete_user' | 'audience_preview' | 'view_user'
  target_id?: string
  occurred_at: ISODate
}
