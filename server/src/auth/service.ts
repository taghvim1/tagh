import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import type { Config } from '../config.js'
import type { Secrets } from '../secrets.js'
import type { Store } from '../store/types.js'
import type { Ghasedak, SmsErrorKind, SmsResult } from './ghasedak.js'
import { maskPhone, normalizeIranMobile, toLatinDigits } from './phone.js'

// ورود با کد یک‌بارمصرف پیامکی. همه‌چیز روی KV ذخیره می‌شود (با هر سه نوع Store کار می‌کند؛ بدون تغییر در جدول‌ها).
// امنیت: کد فقط به‌صورت HMAC ذخیره می‌شود؛ اعتبار ۲ دقیقه؛ حداکثر ۵ تلاش؛ فاصلهٔ ارسال ۶۰ ثانیه؛ حداکثر ۵ ارسال در ساعت برای هر شماره؛
// نشست با توکن تصادفی (فقط هش آن ذخیره می‌شود). عملیات هر شماره پشت یک قفل درون‌پردازشی سریال است (فرض: یک نمونهٔ سرور).
export const OTP_TTL_S = 120, RESEND_S = 60, MAX_SENDS_PER_HOUR = 5, MAX_ATTEMPTS = 5, SESSION_DAYS = 30, LOG_MAX = 30
export const DEFAULT_TEMPLATE_NAME = 'taghvim-otp'
export const DEFAULT_TEMPLATE_TEXT = 'کد ورود شما به تقویم سفر: %param1%'

export interface SmsSettings { template: string; enabled: boolean }
export interface UserRecord { id: string; phone: string; created_at: string; last_login_at: string; anonymous_ids: string[] }
export interface PublicUser { id: string; phone_masked: string; created_at: string }
export interface SmsLogEntry { at: string; phone_masked: string; kind: 'login' | 'test'; ok: boolean; error?: SmsErrorKind }
interface Challenge { hash: string | null; expires_at: number; attempts: number; sends: number[] }
interface SessionRecord { user_id: string; created_at: string; expires_at: number }

export type RequestResult =
  | { ok: true; expiresIn: number; resendIn: number; devCode?: string }
  | { ok: false; error: 'invalid_phone' | 'sms_unavailable' | 'too_soon' | 'too_many' | 'sms_failed'; retryAfter?: number; kind?: SmsErrorKind }
export type VerifyResult =
  | { ok: true; token: string; maxAgeS: number; user: PublicUser; created: boolean }
  | { ok: false; error: 'invalid' | 'expired' | 'wrong_code' | 'locked'; attemptsLeft?: number }

const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const parse = <T>(raw: string | null): T | null => { try { return raw ? (JSON.parse(raw) as T) : null } catch { return null } }
export const publicUser = (u: UserRecord): PublicUser => ({ id: u.id, phone_masked: maskPhone(u.phone), created_at: u.created_at })

export interface AuthDeps { store: Store; secrets: Secrets; sms: Ghasedak; config: Config; now?: () => number }
export function createAuthService(d: AuthDeps) {
  const { store, secrets, sms, config } = d
  const now = d.now ?? (() => Date.now())
  const pepper = config.SECRETS_ENCRYPTION_KEY ?? randomBytes(32).toString('hex') // بدون کلید ثابت: فقط برای عمر همین پردازش (کد ۲ دقیقه اعتبار دارد)
  const hashCode = (phone: string, code: string) => createHmac('sha256', pepper).update(`${phone}:${code}`).digest('hex')
  const locks = new Map<string, Promise<unknown>>()
  const locked = <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
    const prev = locks.get(key) ?? Promise.resolve()
    const p = prev.catch(() => undefined).then(fn)
    const tail = p.catch(() => undefined)
    locks.set(key, tail); void tail.then(() => { if (locks.get(key) === tail) locks.delete(key) })
    return p
  }
  const devEcho = async () => config.AUTH_DEV_ECHO === 'true' && config.NODE_ENV === 'development' && !(await secrets.get('ghasedak'))

  // ---- تنظیمات و وضعیت ----
  const SETTINGS_KEY = 'auth:sms_settings'
  async function loadSettings(): Promise<SmsSettings> {
    const s = parse<Partial<SmsSettings>>(await store.getKV(SETTINGS_KEY))
    return { template: typeof s?.template === 'string' && s.template ? s.template : DEFAULT_TEMPLATE_NAME, enabled: s?.enabled !== false }
  }
  const saveSettings = (s: SmsSettings) => store.setKV(SETTINGS_KEY, JSON.stringify(s))
  async function status() {
    const settings = await loadSettings(), configured = !!(await secrets.get('ghasedak'))
    return { configured, settings, available: configured && settings.enabled && !!settings.template }
  }

  // ---- گزارش ارسال (فقط شمارهٔ ماسک‌شده؛ هرگز کد) ----
  const LOG_KEY = 'auth:sms_log'
  const logQueue = { p: Promise.resolve() as Promise<unknown> }
  const appendLog = (e: Omit<SmsLogEntry, 'at'>) => {
    logQueue.p = logQueue.p.catch(() => undefined).then(async () => {
      const list = parse<SmsLogEntry[]>(await store.getKV(LOG_KEY)) ?? []
      await store.setKV(LOG_KEY, JSON.stringify([{ at: new Date(now()).toISOString(), ...e }, ...list].slice(0, LOG_MAX)))
    })
    return logQueue.p
  }
  const readLog = async () => parse<SmsLogEntry[]>(await store.getKV(LOG_KEY)) ?? []

  const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

  // ---- درخواست کد ----
  async function requestOtp(rawPhone: unknown): Promise<RequestResult> {
    const phone = normalizeIranMobile(rawPhone)
    if (!phone) return { ok: false, error: 'invalid_phone' }
    const ph = sha(phone), key = `auth:otp:${ph}`
    return locked(ph, async () => {
      const st = await status(), echo = await devEcho()
      if (!st.available && !echo) return { ok: false, error: 'sms_unavailable' } as const
      const t = now(), ch = parse<Challenge>(await store.getKV(key))
      const sends = (ch?.sends ?? []).filter((x) => t - x < 3_600_000)
      const last = sends[sends.length - 1]
      if (last !== undefined && t - last < RESEND_S * 1000) return { ok: false, error: 'too_soon', retryAfter: Math.ceil((RESEND_S * 1000 - (t - last)) / 1000) } as const
      if (sends.length >= MAX_SENDS_PER_HOUR) return { ok: false, error: 'too_many', retryAfter: Math.ceil((sends[0] + 3_600_000 - t) / 1000) } as const
      const code = newCode()
      let out: SmsResult<object> = { ok: true, data: {} }
      if (!(echo && !st.available)) out = await sms.sendVerify(phone, code, st.settings.template)
      void appendLog({ phone_masked: maskPhone(phone), kind: 'login', ok: out.ok, ...(out.ok ? {} : { error: out.error }) })
      // ارسال ناموفق هم در سقف‌ها حساب می‌شود (جلوگیری از فشار روی سرویس پیامک)
      if (!out.ok) { await store.setKV(key, JSON.stringify({ hash: null, expires_at: 0, attempts: 0, sends: [...sends, t] } satisfies Challenge)); return { ok: false, error: 'sms_failed', kind: out.error } as const }
      await store.setKV(key, JSON.stringify({ hash: hashCode(phone, code), expires_at: t + OTP_TTL_S * 1000, attempts: 0, sends: [...sends, t] } satisfies Challenge))
      return { ok: true, expiresIn: OTP_TTL_S, resendIn: RESEND_S, ...(echo && !st.available ? { devCode: code } : {}) } as const
    })
  }

  // ---- تأیید کد و ساخت نشست ----
  async function verifyOtp(rawPhone: unknown, rawCode: unknown, anonymousId?: string): Promise<VerifyResult> {
    const phone = normalizeIranMobile(rawPhone), code = typeof rawCode === 'string' ? toLatinDigits(rawCode).trim() : ''
    if (!phone || !/^\d{6}$/.test(code)) return { ok: false, error: 'invalid' }
    const ph = sha(phone), key = `auth:otp:${ph}`
    return locked(ph, async () => {
      const t = now(), ch = parse<Challenge>(await store.getKV(key))
      if (!ch || !ch.hash || t > ch.expires_at) return { ok: false, error: 'expired' } as const
      if (ch.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'locked' } as const
      const a = Buffer.from(hashCode(phone, code)), b = Buffer.from(ch.hash)
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        const attempts = ch.attempts + 1
        await store.setKV(key, JSON.stringify({ ...ch, attempts, hash: attempts >= MAX_ATTEMPTS ? null : ch.hash } satisfies Challenge)) // پس از تلاش آخر، کد باطل می‌شود
        return attempts >= MAX_ATTEMPTS ? ({ ok: false, error: 'locked' } as const) : ({ ok: false, error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - attempts } as const)
      }
      await store.setKV(key, JSON.stringify({ ...ch, hash: null, attempts: 0 } satisfies Challenge)) // کد یک‌بارمصرف
      // کاربر
      const isoNow = new Date(t).toISOString()
      let user = parse<UserRecord>(await store.getKV(`auth:user:${await store.getKV(`auth:phone:${ph}`)}`))
      let created = false
      if (!user) {
        user = { id: randomUUID(), phone, created_at: isoNow, last_login_at: isoNow, anonymous_ids: [] }
        await store.setKV(`auth:phone:${ph}`, user.id); created = true
      }
      user = { ...user, last_login_at: isoNow, anonymous_ids: anonymousId && !user.anonymous_ids.includes(anonymousId) ? [...user.anonymous_ids, anonymousId].slice(-20) : user.anonymous_ids }
      await store.setKV(`auth:user:${user.id}`, JSON.stringify(user))
      // نشست
      const token = randomBytes(32).toString('base64url'), maxAgeS = SESSION_DAYS * 86400
      await store.setKV(`auth:session:${sha(token)}`, JSON.stringify({ user_id: user.id, created_at: isoNow, expires_at: t + maxAgeS * 1000 } satisfies SessionRecord))
      return { ok: true, token, maxAgeS, user: publicUser(user), created } as const
    })
  }

  async function userForToken(token: string | undefined): Promise<UserRecord | null> {
    if (!token || token.length > 100) return null
    const k = `auth:session:${sha(token)}`, s = parse<SessionRecord>(await store.getKV(k))
    if (!s) return null
    if (now() > s.expires_at) { await store.deleteKV(k); return null }
    return parse<UserRecord>(await store.getKV(`auth:user:${s.user_id}`)) // کاربر حذف‌شده ⇒ همهٔ نشست‌هایش خودکار بی‌اعتبار است
  }
  const logout = (token: string | undefined) => (token ? store.deleteKV(`auth:session:${sha(token)}`) : Promise.resolve())
  async function deleteAccount(u: UserRecord, token: string | undefined) {
    await store.deleteKV(`auth:user:${u.id}`); await store.deleteKV(`auth:phone:${sha(u.phone)}`); await store.deleteKV(`auth:otp:${sha(u.phone)}`)
    await logout(token)
  }

  // ---- ابزار تست مدیر ----
  async function testSend(rawPhone: unknown): Promise<{ ok: true; messageId: number } | { ok: false; error: 'invalid_phone' } | { ok: false; error: SmsErrorKind; message: string }> {
    const phone = normalizeIranMobile(rawPhone)
    if (!phone) return { ok: false, error: 'invalid_phone' }
    const r = await sms.sendVerify(phone, newCode(), (await loadSettings()).template)
    void appendLog({ phone_masked: maskPhone(phone), kind: 'test', ok: r.ok, ...(r.ok ? {} : { error: r.error }) })
    return r.ok ? { ok: true, messageId: r.data.messageId } : r
  }

  /** آیا کاربران می‌توانند وارد شوند؟ (پیامک آماده است یا حالت توسعهٔ محلی) */
  const canLogin = async () => (await status()).available || (await devEcho())

  return { status, canLogin, loadSettings, saveSettings, requestOtp, verifyOtp, userForToken, logout, deleteAccount, testSend, readLog }
}
export type AuthService = ReturnType<typeof createAuthService>
