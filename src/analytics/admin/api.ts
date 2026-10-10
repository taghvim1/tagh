import { nowISO } from '../ids'
import type { ActivityEvent, AdminAuditLog } from '../types'
import { assertCan, auditEntry, type AdminRole } from './access'
import { buildDemoProfiles } from './demoData'
import type { Page, ProfileRecord, UserDetail, UserSummary } from './profiles'
import { dashboardStats, detailOf, listProfiles, pageEvents, previewAudience, type AudienceCounts, type DashboardStats, type ListQuery, type ProfileFilters } from './query'

export class ApiUnavailableError extends Error { constructor(public code: string = 'API_UNAVAILABLE') { super(code) } }
export class NotReadyError extends Error { constructor(public feature: string) { super('NOT_READY:' + feature) } }

export interface OfferDraft { title: string; body: string; kind: 'promotional'; filters: ProfileFilters }
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
  sendOffer(a: Actor, draft: OfferDraft): Promise<never>
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
    async sendOffer() { throw new NotReadyError('send_offer') }, // ارسال واقعی غیرفعال است
  }
}

/** کلاینت API واقعی: هنوز هیچ سرویسی وجود ندارد، پس هر فراخوانی خطای «در دسترس نیست» می‌دهد (نه داده ساختگی). */
export function createRemoteApi(baseUrl = '/api/admin', fetchImpl: typeof fetch = (...a) => fetch(...a)): UsersApi {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response
    try { res = await fetchImpl(baseUrl + path, { credentials: 'include', headers: { 'content-type': 'application/json' }, ...init }) } catch { throw new ApiUnavailableError('NETWORK_ERROR') }
    if (res.status === 401 || res.status === 403) throw new ApiUnavailableError('UNAUTHORIZED')
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) throw new ApiUnavailableError('BACKEND_NOT_CONNECTED')
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
    sendOffer: async () => { throw new NotReadyError('send_offer') },
  }
}
export { nowISO }
