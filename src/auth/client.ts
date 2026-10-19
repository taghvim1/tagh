import { useSyncExternalStore } from 'react'

// کلاینت ورود با کد پیامکی. نشست در کوکی HttpOnly است (جاوااسکریپت توکنی نمی‌بیند)؛ اینجا فقط وضعیت نمایشی (شمارهٔ ماسک‌شده) نگه‌داری می‌شود.
export interface AuthUser { id: string; phone_masked: string; created_at: string }
export interface AuthState { status: 'unknown' | 'out' | 'in'; user: AuthUser | null; /** آیا سرور ورود پیامکی را پشتیبانی می‌کند؟ (null = هنوز معلوم نیست) */ available: boolean | null }

let state: AuthState = { status: 'unknown', user: null, available: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<AuthState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
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

export type RequestError = 'invalid_phone' | 'too_soon' | 'too_many' | 'sms_unavailable' | 'sms_failed' | 'forbidden' | 'network'
export type RequestOutcome = { ok: true; resendIn: number; expiresIn: number; devCode?: string } | { ok: false; error: RequestError; retryAfter?: number }
export async function requestCode(phone: string, fetchImpl?: typeof fetch): Promise<RequestOutcome> {
  const r = await http('/auth/otp/request', { method: 'POST', body: { phone } }, fetchImpl)
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
  const r = await http('/auth/otp/verify', { method: 'POST', body: { phone, code, ...(anonymousId ? { anonymous_id: anonymousId } : {}) } }, fetchImpl)
  if (!r) return { ok: false, error: 'network' }
  if (r.status === 200) { const user = r.json.user as AuthUser; set({ status: 'in', user }); return { ok: true, user, created: r.json.created === true } }
  if (r.status === 403) return { ok: false, error: 'forbidden' }
  const e = String(r.json.error)
  return { ok: false, error: e === 'expired' || e === 'wrong_code' || e === 'locked' ? e : 'invalid', ...(typeof r.json.attempts_left === 'number' ? { attemptsLeft: r.json.attempts_left } : {}) }
}

export async function logout(fetchImpl?: typeof fetch) { const r = await http('/auth/logout', { method: 'POST' }, fetchImpl); if (r) set({ status: 'out', user: null }); return !!r }
export async function deleteAccount(fetchImpl?: typeof fetch) { const r = await http('/auth/account', { method: 'DELETE' }, fetchImpl); if (r && (r.status === 204 || r.status === 401)) { set({ status: 'out', user: null }); return true } return false }
