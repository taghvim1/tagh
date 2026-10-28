import type { Status, SuggestionContent } from '../domain/schema.js'

export interface AiMeta { model?: string; prompt_version?: number; used_fallback?: boolean; sources: { title: string; url: string; snippet?: string }[]; generated_at?: string; warnings?: string[] }
export interface SuggestionRow {
  id: number; status: Status; source: 'manual' | 'ai' | 'import'
  name: string; country: string; content: SuggestionContent; version: number
  cover_image_id: number | null; reject_reason: string | null; ai_meta: AiMeta | null
  created_at: string; updated_at: string; published_at: string | null
}
export interface VersionRow { id: number; suggestion_id: number; version: number; content: SuggestionContent; note: string; created_at: string }
export type ImageStatus = 'candidate' | 'approved' | 'rejected'
export interface ImageRow {
  id: number; suggestion_id: number; url: string; thumb_url: string | null; provider: string
  source_url: string | null; author: string | null; license: string | null; license_url: string | null; attribution: string | null
  status: ImageStatus; created_at: string; decided_at: string | null
}
export interface PromptRow { id: number; version: number; text: string; note: string; active: boolean; created_at: string }

export interface EventRow { event_id: string; anonymous_id: string; event_type: string; occurred_at: string; session_id: string; props: Record<string, unknown>; app_version: string; platform: string; consent_context: Record<string, boolean>; received_at: string }
export interface ConsentRow { consent_id: string; subject_id: string; kind: string; granted: boolean; recorded_at: string; policy_version: string; source: string; received_at: string }

export interface SuggestionQuery { status?: Status; q?: string; scope?: 'domestic' | 'international'; sort?: 'updated' | 'created' | 'name'; order?: 'asc' | 'desc'; limit: number; offset: number }

/** رابط ذخیره‌سازی (همه async تا پیاده‌سازی PostgreSQL بدون تغییر در سرویس‌ها جایگزین شود؛ طرح جدول‌ها در migrations/001_init.sql است) */
export interface Store {
  /** نوع ذخیره‌سازی: postgres = ماندگار؛ file = فایل JSON (با دیپلوی روی سرویس‌های بدون Volume پاک می‌شود)؛ memory = فقط حافظه */
  readonly kind: 'postgres' | 'file' | 'memory'
  listSuggestions(q: SuggestionQuery): Promise<{ items: SuggestionRow[]; total: number; counts: Record<string, number> }>
  allSuggestions(): Promise<SuggestionRow[]>
  getSuggestion(id: number): Promise<SuggestionRow | null>
  insertSuggestion(row: Omit<SuggestionRow, 'id'>): Promise<SuggestionRow>
  updateSuggestion(id: number, patch: Partial<Omit<SuggestionRow, 'id'>>): Promise<SuggestionRow | null>
  deleteSuggestion(id: number): Promise<boolean>
  addVersion(row: Omit<VersionRow, 'id'>): Promise<VersionRow>
  listVersions(suggestionId: number): Promise<VersionRow[]>
  addImage(row: Omit<ImageRow, 'id'>): Promise<ImageRow>
  listImages(suggestionId: number): Promise<ImageRow[]>
  getImage(id: number): Promise<ImageRow | null>
  updateImage(id: number, patch: Partial<Omit<ImageRow, 'id'>>): Promise<ImageRow | null>
  deleteImage(id: number): Promise<boolean>
  listPrompts(): Promise<PromptRow[]>
  addPrompt(row: Omit<PromptRow, 'id' | 'version' | 'active'>): Promise<PromptRow>
  activatePrompt(id: number): Promise<PromptRow | null>
  addConsents(rows: ConsentRow[]): Promise<number>
  /** آخرین رضایت ثبت‌شدهٔ این نصب برای هر نوع (بر اساس recorded_at) */
  latestConsents(subjectId: string): Promise<Record<string, boolean>>
  addEvents(rows: EventRow[]): Promise<{ inserted: number; duplicates: number }>
  eventStats(): Promise<{ events: number; consents: number }>
  /** رویدادهای یک کاربر (همهٔ شناسه‌های نصبِ او)، تازه‌ترین اول؛ برای صفحه‌بندی و پروفایل در پنل مدیریت */
  eventsOf(anonIds: string[], opts: { limit: number; offset?: number }): Promise<{ items: EventRow[]; total: number }>
  /** رویدادهای ثبت‌شده از یک زمان به بعد (برای آمار داشبورد)؛ حداکثر limit ردیف، تازه‌ترین اول */
  eventsSince(sinceISO: string, limit: number): Promise<EventRow[]>
  /** همهٔ رکوردهای رضایت شناسه‌های نصب (قدیمی‌ترین اول) */
  consentsOf(anonIds: string[]): Promise<ConsentRow[]>
  /** حذف رویدادها و رضایت‌های شناسه‌های نصب؛ تعداد حذف‌شده را برمی‌گرداند */
  deleteSubjects(anonIds: string[]): Promise<{ events: number; consents: number }>
  getKV(key: string): Promise<string | null>
  setKV(key: string, value: string): Promise<void>
  deleteKV(key: string): Promise<void>
  close(): Promise<void>
}
