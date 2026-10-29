import { nowISO } from '../ids'
import type { ActivityEvent, AdminAuditLog } from '../types'
import { assertCan, auditEntry, type AdminRole } from './access'
import { buildDemoProfiles } from './demoData'
import type { Page, ProfileRecord, UserDetail, UserSummary } from './profiles'
import { dashboardStats, detailOf, listProfiles, pageEvents, previewAudience, type AudienceCounts, type DashboardStats, type ListQuery, type ProfileFilters } from './query'

export class ApiUnavailableError extends Error { constructor(public code: string = 'API_UNAVAILABLE') { super(code) } }
export class NotReadyError extends Error { constructor(public feature: string) { super('NOT_READY:' + feature) } }
/** خطای معنادار سرور (مثلاً «تعداد گیرندگان بیش از سقف است») با پیام فارسی همان‌جا */
export class ApiRequestError extends Error { constructor(message: string, public code: string) { super(message) } }

export interface OfferDraft { title: string; body: string; kind: 'promotional'; filters: ProfileFilters; /** مسیر داخلی برنامه که با کلیک روی اعلان باز می‌شود */ url?: string }
export interface OfferResult { matched: number; targeted: number; sent: number; failed: number; removed: number }
export interface PromoLog extends OfferResult { at: string; title: string; body: string; url: string }
export interface Actor { adminId: string; role: AdminRole }

/** قرارداد API مدیریت کاربران. پیاده‌سازی واقعی باید روی سرور باشد و مجوزها را همان‌جا دوباره بررسی کند. */
export interface UsersApi {
  readonly kind: 'demo' | 'remote'
  /** آیا داده واقعی و چندکاربره است؟ */
  readonly isReal: boolean
  stats(a: Actor): Promise<DashboardStats>
  list(a: Actor, q: ListQuery): Promise<Page<UserSummary>>
  detail(a: Actor, id: string, opts?: { includeContact?: boolean }): Promise<UserDetail>
  events(a: Actor, id: string, page: number, pageSize?: number): Promise<Page<ActivityEvent>>
  audience(a: Actor, filters: ProfileFilters): Promise<AudienceCounts>
  disable(a: Actor, id: string, confirm: string): Promise<void>
  remove(a: Actor, id: string, confirm: string): Promise<void>
  /** ارسال واقعی فقط در سرور (فقط به واجدین شرایط: رضایت تبلیغاتی + اشتراک اعلان + سقف تکرار) */
  sendOffer(a: Actor, draft: OfferDraft): Promise<OfferResult>
  /** مهمان‌های بی‌فعالیت (یک‌بار-بازشده و برنگشته) */
  staleGuests(a: Actor, days: number): Promise<{ days: number; count: number }>
  cleanupGuests(a: Actor, days: number): Promise<{ removed: number; deleted_events: number; deleted_consents: number }>
  pushTest(a: Actor, id: string): Promise<{ result: 'ok' | 'gone' | 'fail' }>
  promoHistory(a: Actor): Promise<{ items: PromoLog[] }>
}

/** نسخهٔ نمایشی در حافظه (با داده ساختگی). تغییرات با بارگذاری دوباره از بین می‌رود و هیچ‌جا ذخیره نمی‌شود. */
export function createDemoApi(now: () => Date = () => new Date(), seed?: ProfileRecord[]): UsersApi & { audit(): AdminAuditLog[] } {
  const data = seed ?? buildDemoProfiles(now())
  const audits: AdminAuditLog[] = []
  const log = (a: Actor, action: AdminAuditLog['action'], target?: string) => { audits.push(auditEntry(a.adminId, a.role, action, target, now())) }
  const find = (id: string) => { const p = data.find((x) => x.id === id && x.state !== 'deleted'); if (!p) throw new ApiUnavailableError('NOT_FOUND'); return p }
  return {
    kind: 'demo', isReal: false, audit: () => [...audits],
    async stats(a) { assertCan(a.role, 'users.view'); return dashboardStats(data, now()) },
    async list(a, q) { assertCan(a.role, 'users.view'); return listProfiles(data, q, now()) },
    async detail(a, id, opts) {
      assertCan(a.role, 'users.view')
      const wantContact = !!opts?.includeContact
      if (wantContact) { assertCan(a.role, 'users.view_contact'); log(a, 'view_contact', id) } else log(a, 'view_user', id)
      return detailOf(find(id), wantContact)
    },
    async events(a, id, page, size) { assertCan(a.role, 'users.view'); return pageEvents(find(id), page, size) },
    async audience(a, f) { assertCan(a.role, 'audience.preview'); log(a, 'audience_preview'); return previewAudience(data, f, now()) },
    async disable(a, id, confirm) { assertCan(a.role, 'users.disable'); if (confirm !== id) throw new Error('CONFIRMATION_MISMATCH'); find(id).state = 'disabled'; log(a, 'disable_user', id) },
    async remove(a, id, confirm) { assertCan(a.role, 'users.delete'); if (confirm !== id) throw new Error('CONFIRMATION_MISMATCH'); find(id).state = 'deleted'; log(a, 'delete_user', id) },
    async sendOffer() { throw new NotReadyError('send_offer') }, // نسخهٔ نمایشی هرگز چیزی نمی‌فرستد
    async staleGuests() { throw new NotReadyError('cleanup') },
    async cleanupGuests() { throw new NotReadyError('cleanup') },
    async pushTest() { throw new NotReadyError('push_test') },
    async promoHistory() { return { items: [] } },
  }
}

/** کلاینت API واقعی (سرور). اگر سرور در دسترس یا مجاز نباشد، خطا می‌دهد و هرگز داده ساختگی جایگزین نمی‌شود. توکن مدیر همان است که در ورود به پنل ذخیره شده. */
export function createRemoteApi(baseUrl = '/api/admin', fetchImpl: typeof fetch = (...a) => fetch(...a)): UsersApi {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response
    let token = ''; try { token = sessionStorage.getItem('adm-token') ?? '' } catch { /* بدون ذخیره‌سازی */ }
    try { res = await fetchImpl(baseUrl + path, { credentials: 'include', ...init, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) } }) } catch { throw new ApiUnavailableError('NETWORK_ERROR') }
    if (res.status === 401 || res.status === 403) throw new ApiUnavailableError('UNAUTHORIZED')
    const isJson = (res.headers.get('content-type') ?? '').includes('json')
    if (!res.ok && isJson && res.status !== 404) { // پاسخ خطای معنادار سرور (اعتبارسنجی، تأیید لازم، سقف گیرندگان…)
      const j = await res.json().catch(() => ({})) as { error?: string; errors?: string[] }
      throw new ApiRequestError(j.errors?.[0] ?? j.error ?? `HTTP_${res.status}`, j.error ?? 'error')
    }
    if (!res.ok || !isJson) throw new ApiUnavailableError('BACKEND_NOT_CONNECTED')
    return res.json() as Promise<T>
  }
  const qs = (o: object) => '?q=' + encodeURIComponent(JSON.stringify(o))
  return {
    kind: 'remote', isReal: true,
    stats: () => req('/users/stats'),
    list: (_a, q) => req('/users' + qs(q)),
    detail: (_a, id, o) => req(`/users/${encodeURIComponent(id)}${o?.includeContact ? '?contact=1' : ''}`),
    events: (_a, id, page, size = 20) => req(`/users/${encodeURIComponent(id)}/events?page=${page}&pageSize=${size}`),
    audience: (_a, f) => req('/audience/preview', { method: 'POST', body: JSON.stringify(f) }),
    disable: (_a, id, confirm) => req(`/users/${encodeURIComponent(id)}/disable`, { method: 'POST', body: JSON.stringify({ confirm }) }),
    remove: (_a, id, confirm) => req(`/users/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ confirm }) }),
    sendOffer: (_a, d) => req('/audience/send', { method: 'POST', body: JSON.stringify({ title: d.title, body: d.body, url: d.url || '/', filters: d.filters, confirm: true }) }),
    staleGuests: (_a, days) => req(`/users/stale-count?days=${days}`),
    cleanupGuests: (_a, days) => req('/users/cleanup', { method: 'POST', body: JSON.stringify({ olderThanDays: days, confirm: true }) }),
    pushTest: (_a, id) => req(`/users/${encodeURIComponent(id)}/push-test`, { method: 'POST', body: JSON.stringify({}) }),
    promoHistory: () => req('/audience/history'),
  }
}
export { nowISO }
