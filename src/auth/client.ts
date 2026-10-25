import { useSyncExternalStore } from 'react'

// کلاینت ورود با کد پیامکی. نشست در کوکی HttpOnly است (جاوااسکریپت توکنی نمی‌بیند)؛ اینجا فقط وضعیت نمایشی (شمارهٔ ماسک‌شده) نگه‌داری می‌شود.
export interface AuthProfile { first_name: string; last_name: string; city: string; email?: string }
export interface AuthUser { id: string; phone_masked: string; created_at: string; profile?: AuthProfile | null; profile_complete?: boolean }

// شناسهٔ نصب: عدد تصادفی بی‌اطلاعات شخصی، جدا از شناسهٔ تحلیل؛ فقط برای شمارش نصب‌ها و وصل‌شدن به حساب پس از ثبت‌نام
const INSTALL_KEY = 'tp-install-id'
export function getInstallId(): string | undefined {
  try {
    let id = localStorage.getItem(INSTALL_KEY)
    if (!id || id.length < 8) { id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`); localStorage.setItem(INSTALL_KEY, id) }
    return id
  } catch { return undefined }
}
/** هر بار برنامه باز می‌شود: نصب تازه در پنل مدیریت «مهمان» ثبت می‌شود (بی‌صدا؛ خطا نادیده گرفته می‌شود). */
const PING_KEY = 'tp-install-ping', PING_GAP = 30 * 60_000
export async function registerInstallation(fetchImpl?: typeof fetch): Promise<boolean> {
  const id = getInstallId(); if (!id) return false
  // حداکثر هر ۳۰ دقیقه یک بار (به اندازهٔ یک «نشست»)؛ بازشدن‌های پشت‌سرهم درخواستی به سرور نمی‌فرستند
  try { const last = Number(localStorage.getItem(PING_KEY) ?? 0); if (Date.now() - last < PING_GAP) return true } catch { /* بدون ذخیره‌سازی */ }
  const pwa = (() => { try { return window.matchMedia?.('(display-mode: standalone)').matches === true } catch { return false } })()
  const r = await http('/installations', { method: 'POST', body: { installation_id: id, platform: pwa ? 'pwa' : 'web', app_version: '1' } }, fetchImpl)
  const ok = !!r && r.status === 204
  if (ok) { try { localStorage.setItem(PING_KEY, String(Date.now())) } catch { /* فقط حافظه */ } }
  return ok
}
export interface AuthState { status: 'unknown' | 'out' | 'in'; user: AuthUser | null; /** آیا سرور ورود پیامکی را پشتیبانی می‌کند؟ (null = هنوز معلوم نیست) */ available: boolean | null }

// پروفایل کاربرِ واردشده روی همین دستگاه نگه داشته می‌شود تا هنگام باز شدن برنامه از سرور بارگذاری نشود (آفلاین هم نمایش داده می‌شود)؛ سرور فقط در پس‌زمینه تأیید می‌کند.
const CACHE_KEY = 'tp-auth-cache-v1'
const readCache = (): AuthUser | null => { try { const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as AuthUser | null; return v && typeof v.id === 'string' ? v : null } catch { return null } }
const writeCache = (u: AuthUser | null) => { try { if (u) localStorage.setItem(CACHE_KEY, JSON.stringify(u)); else localStorage.removeItem(CACHE_KEY) } catch { /* فقط حافظه */ } }
const cached = readCache()
let state: AuthState = { status: cached ? 'in' : 'unknown', user: cached, available: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch }
  if ('user' in patch || 'status' in patch) writeCache(state.status === 'in' ? state.user : null)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getAuth = () => state
export const useAuth = () => useSyncExternalStore(subscribe, getAuth, getAuth)

interface Reply { status: number; json: Record<string, unknown> }
async function http(path: string, init: { method?: string; body?: unknown } = {}, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<Reply | null> {
  try {
    const res = await fetchImpl(`/api${path}`, { method: init.method ?? 'GET', credentials: 'same-origin', headers: { accept: 'application/json', ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}) }, ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}) })
    if (res.status === 204) return { status: 204, json: {} }
    if (!(res.headers.get('content-type') ?? '').includes('json')) return null // سرور API در دسترس نیست (مثلاً فقط فایل‌های ثابت)
    return { status: res.status, json: (await res.json()) as Record<string, unknown> }
  } catch { return null }
}

/** وضعیت ورود و در دسترس‌بودن ورود پیامکی را از سرور می‌گیرد. بدون شبکه، وضعیت قبلی حفظ می‌شود. */
export async function refreshAuth(fetchImpl?: typeof fetch) {
  const [cfg, me] = await Promise.all([http('/auth/config', {}, fetchImpl), http('/auth/me', {}, fetchImpl)])
  if (!cfg || !me) { set({ available: state.available ?? false, status: state.status === 'unknown' ? 'out' : state.status }); return }
  const user = (me.json.user as AuthUser | null) ?? null
  set({ available: cfg.json.sms === true, status: user ? 'in' : 'out', user })
}

export type OtpPurpose = 'login' | 'reset'
export type RequestError = 'invalid_phone' | 'too_soon' | 'too_many' | 'sms_unavailable' | 'sms_failed' | 'forbidden' | 'network'
export type RequestOutcome = { ok: true; resendIn: number; expiresIn: number; devCode?: string } | { ok: false; error: RequestError; retryAfter?: number }
export async function requestCode(phone: string, fetchImpl?: typeof fetch, purpose?: OtpPurpose): Promise<RequestOutcome> {
  const r = await http('/auth/otp/request', { method: 'POST', body: { phone, ...(purpose ? { purpose } : {}) } }, fetchImpl)
  if (!r) return { ok: false, error: 'network' }
  if (r.status === 200) return { ok: true, resendIn: Number(r.json.resend_in) || 60, expiresIn: Number(r.json.expires_in) || 120, ...(typeof r.json.dev_code === 'string' ? { devCode: r.json.dev_code } : {}) }
  if (r.status === 403) return { ok: false, error: 'forbidden' }
  const e = String(r.json.error)
  const error: RequestError = e === 'invalid_phone' || e === 'too_soon' || e === 'too_many' || e === 'sms_unavailable' ? e : 'sms_failed'
  return { ok: false, error, ...(typeof r.json.retry_after === 'number' ? { retryAfter: r.json.retry_after } : {}) }
}

export type VerifyError = 'invalid' | 'expired' | 'wrong_code' | 'locked' | 'forbidden' | 'network'
export type VerifyOutcome = { ok: true; user: AuthUser; created: boolean } | { ok: false; error: VerifyError; attemptsLeft?: number }
/** anonymousId فقط وقتی داده شود که کاربر به تحلیل ناشناس رضایت داده؛ برای وصل‌کردن رویدادهای قبلی به حساب */
export async function verifyCode(phone: string, code: string, anonymousId?: string, fetchImpl?: typeof fetch): Promise<VerifyOutcome> {
  const r = await http('/auth/otp/verify', { method: 'POST', body: { phone, code, ...(anonymousId ? { anonymous_id: anonymousId } : {}), ...(getInstallId() ? { installation_id: getInstallId() } : {}) } }, fetchImpl)
  if (!r) return { ok: false, error: 'network' }
  if (r.status === 200) { const user = r.json.user as AuthUser; set({ status: 'in', user }); return { ok: true, user, created: r.json.created === true } }
  if (r.status === 403) return { ok: false, error: 'forbidden' }
  const e = String(r.json.error)
  return { ok: false, error: e === 'expired' || e === 'wrong_code' || e === 'locked' ? e : 'invalid', ...(typeof r.json.attempts_left === 'number' ? { attemptsLeft: r.json.attempts_left } : {}) }
}

export async function logout(fetchImpl?: typeof fetch) { const r = await http('/auth/logout', { method: 'POST' }, fetchImpl); if (r) set({ status: 'out', user: null }); return !!r }
export async function deleteAccount(fetchImpl?: typeof fetch) { const r = await http('/auth/account', { method: 'DELETE' }, fetchImpl); if (r && (r.status === 204 || r.status === 401)) { set({ status: 'out', user: null }); return true } return false }

export type ProfileOutcome = { ok: true; user: AuthUser } | { ok: false; error: 'invalid' | 'unauthorized' | 'network' }
/** تکمیل/ویرایش پروفایل؛ در پنل مدیریت هم همان لحظه ثبت می‌شود. */
export async function saveProfile(p: AuthProfile, fetchImpl?: typeof fetch): Promise<ProfileOutcome> {
  const r = await http('/auth/profile', { method: 'PUT', body: p }, fetchImpl)
  if (!r) return { ok: false, error: 'network' }
  if (r.status === 200) { const user = r.json.user as AuthUser; set({ status: 'in', user }); return { ok: true, user } }
  if (r.status === 401) { set({ status: 'out', user: null }); return { ok: false, error: 'unauthorized' } }
  return { ok: false, error: 'invalid' }
}
