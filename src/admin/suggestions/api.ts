import type { SuggestionContent } from '../../travel/suggestionContent'

// کلاینت API مدیر. هیچ کلیدی اینجا نیست؛ تنها «توکن مدیر» اختیاری (در حالت ADMIN_TOKEN) در sessionStorage همین تب می‌ماند.
export type Status = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived'
export const STATUS_LABEL: Record<Status, string> = { draft: 'پیش‌نویس', pending_review: 'در انتظار بررسی', approved: 'تأییدشده', published: 'منتشرشده', rejected: 'ردشده', archived: 'بایگانی' }
export const STATUS_ORDER: Status[] = ['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived']
export const TRANSITION_LABEL: Record<Status, string> = { draft: 'بازگشت به پیش‌نویس', pending_review: 'ارسال برای بررسی', approved: 'تأیید', published: 'انتشار', rejected: 'رد', archived: 'بایگانی' }
export const NEXT: Record<Status, Status[]> = { draft: ['pending_review', 'archived'], pending_review: ['approved', 'rejected', 'draft'], approved: ['published', 'draft', 'archived'], published: ['approved', 'archived'], rejected: ['draft', 'archived'], archived: ['draft'] }

export interface AiMeta { model?: string; prompt_version?: number; used_fallback?: boolean; sources: { title: string; url: string; snippet?: string }[]; generated_at?: string; warnings?: string[] }
export interface Suggestion { id: number; status: Status; source: 'manual' | 'ai' | 'import'; name: string; country: string; content: SuggestionContent; version: number; cover_image_id: number | null; reject_reason: string | null; ai_meta: AiMeta | null; created_at: string; updated_at: string; published_at: string | null; image_counts?: { candidate: number; approved: number; rejected: number } }
export interface Version { id: number; version: number; content: SuggestionContent; note: string; created_at: string }
export interface SImage { id: number; suggestion_id: number; url: string; thumb_url: string | null; provider: string; source_url: string | null; author: string | null; license: string | null; license_url: string | null; attribution: string | null; status: 'candidate' | 'approved' | 'rejected' }
export interface Dup { id: number; status: Status; name: string }
export interface Detail { suggestion: Suggestion; images: SImage[]; versions: Version[]; duplicates: Dup[]; publish_check: { blocking: string[]; warnings: string[] } }
export interface SecretStatus { configured: boolean; source: 'env' | 'ui' | null; masked: string | null; env_var: string; ui_storage: 'available' | 'needs_encryption_key' | 'blocked_in_production_without_admin_token' }
export interface AiSettings { llm: { primaryModel: string; fallbackModel: string; temperature: number }; webSearch: { enabled: boolean; provider: 'brave'; maxResults: number }; imageSearch: { providers: ('wikimedia' | 'pexels')[]; maxPerProvider: number }; tasks: { generate: { useWebSearch: boolean }; images: { autoSearchOnGenerate: boolean } } }
export interface Prompt { id: number; version: number; text: string; note: string; active: boolean; created_at: string }
export interface GenResult { name: string; ok: boolean; saved: boolean; id?: number; errors?: string[]; content?: SuggestionContent; meta?: AiMeta; duplicates?: Dup[]; images_added?: number; image_errors?: string[] }

export class ApiError extends Error {
  constructor(public status: number, public code: string, public errors: string[] = [], message?: string) { super(message ?? errors[0] ?? code) }
}
const TOKEN_KEY = 'adm-token'
export const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' } }
export const setToken = (t: string) => { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY) } catch { /* فقط حافظه */ } }

export const friendly = (e: unknown): string => {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'ارتباط با سرور برقرار نشد. اگر برنامه با «npm start» (فقط فایل‌های ثابت) اجرا شده، بک‌اند در دسترس نیست.'
    if (e.code === 'admin_disabled') return 'API مدیر در این محیط غیرفعال است (production بدون ADMIN_TOKEN). برای تست، ADMIN_OPEN=true یا ADMIN_TOKEN را تنظیم کنید.'
    if (e.status === 401) return 'توکن مدیر نادرست یا خالی است (بخش «تنظیمات API»).'
    if (e.code === 'version_conflict') return 'این پیشنهاد در جای دیگری تغییر کرده؛ صفحه را تازه کنید.'
    return e.errors.length > 1 ? e.errors.join(' | ') : e.message
  }
  return (e as Error).message
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<T> {
  let res: Response
  const token = getToken()
  try {
    res = await fetchImpl(`/api${path}`, { method: init.method ?? 'GET', headers: { accept: 'application/json', ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: init.body !== undefined ? JSON.stringify(init.body) : undefined, signal: AbortSignal.timeout(init.timeoutMs ?? 30_000) })
  } catch { throw new ApiError(0, 'network') }
  if (res.status === 204) return undefined as T
  const isJson = (res.headers.get('content-type') ?? '').includes('json')
  if (!isJson) throw new ApiError(0, 'network', [], 'سرور API در دسترس نیست (پاسخ JSON نیامد).')
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'error', data.errors ?? [], data.reason ?? data.errors?.[0])
  return data as T
}

// ---- مقایسهٔ نسخه‌ها ----
export interface DiffLine { path: string; before: string; after: string }
const flat = (v: unknown, p = '', out: Record<string, string> = {}): Record<string, string> => {
  if (Array.isArray(v)) out[p] = v.join('، ')
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) flat(x, p ? `${p}.${k}` : k, out)
  else out[p] = v === undefined || v === null ? '' : String(v)
  return out
}
export function diffContent(a: unknown, b: unknown): DiffLine[] {
  const x = flat(a), y = flat(b), keys = [...new Set([...Object.keys(x), ...Object.keys(y)])]
  return keys.filter((k) => (x[k] ?? '') !== (y[k] ?? '')).map((k) => ({ path: k, before: x[k] ?? '', after: y[k] ?? '' }))
}
