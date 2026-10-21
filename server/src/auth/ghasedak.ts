import type { Secrets } from '../secrets.js'

// کلاینت وب‌سرویس پیامک قاصدک (v2). کلید فقط از Secrets خوانده می‌شود و هرگز در خروجی، لاگ یا پیام خطا نمی‌آید.
// ارسال کد با «قالب آماده» (send/verify) انجام می‌شود تا کد حتی روی خط‌های فیلتر/بدون خط خدماتی برسد.
export type SmsErrorKind = 'not_configured' | 'invalid_key' | 'ip_not_allowed' | 'invalid_number' | 'filtered_number' | 'no_credit' | 'template_invalid' | 'unavailable' | 'bad_response' | 'network' | 'unknown'
export interface SmsOutcome<T = object> { ok: true; data: T }
export interface SmsFailure { ok: false; error: SmsErrorKind; /** پیام فارسی برای مدیر (بدون هیچ مقدار محرمانه) */ message: string; code?: number }
export type SmsResult<T = object> = SmsOutcome<T> | SmsFailure

export const SMS_ERROR_FA: Record<SmsErrorKind, string> = {
  not_configured: 'کلید قاصدک تنظیم نشده است (تنظیمات API).',
  invalid_key: 'کلید قاصدک نامعتبر است یا حساب غیرفعال است.',
  ip_not_allowed: 'آی‌پی سرور در فهرست مجاز قاصدک نیست؛ در پنل قاصدک محدودیت آی‌پی را بردارید یا آی‌پی سرور را اضافه کنید.',
  invalid_number: 'شمارهٔ گیرنده نامعتبر است.',
  filtered_number: 'شمارهٔ گیرنده فیلتر شده است.',
  no_credit: 'اعتبار ریالی حساب قاصدک کافی نیست.',
  template_invalid: 'قالب پیامک معتبر نیست؛ نام قالب را با قالب تأییدشده در پنل قاصدک مقایسه کنید.',
  unavailable: 'سرویس قاصدک در دسترس نیست؛ کمی بعد دوباره تلاش کنید.',
  bad_response: 'پاسخ نامعتبر از قاصدک دریافت شد.',
  network: 'ارتباط با قاصدک برقرار نشد (شبکه یا نشانی پایه را بررسی کنید).',
  unknown: 'ارسال پیامک ناموفق بود.',
}
// کدهای خطای مستند قاصدک ← دسته
const BY_CODE: Record<number, SmsErrorKind> = { 1: 'invalid_key', 6: 'invalid_key', 7: 'unknown', 8: 'invalid_number', 9: 'no_credit', 10: 'unavailable', 11: 'ip_not_allowed', 20: 'filtered_number', 21: 'unavailable' }
const fail = (error: SmsErrorKind, code?: number): SmsFailure => ({ ok: false, error, message: SMS_ERROR_FA[error], ...(code !== undefined ? { code } : {}) })

export interface GhasedakDeps { secrets: Secrets; baseUrl: string; fetchImpl?: typeof fetch; timeoutMs?: number }
export function createGhasedak(d: GhasedakDeps) {
  const f = d.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a))
  const base = d.baseUrl.replace(/\/+$/, '')

  async function call(path: string, fields: Record<string, string | number>): Promise<SmsResult<Record<string, unknown>>> {
    const key = await d.secrets.get('ghasedak')
    if (!key) return fail('not_configured')
    let res: Response
    try {
      res = await f(`${base}${path}`, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(d.timeoutMs ?? 10_000),
        headers: { apikey: key.value, 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: new URLSearchParams(Object.entries(fields).map(([k, v]): [string, string] => [k, String(v)])).toString(),
      })
    } catch { return fail('network') }
    let json: Record<string, unknown>
    try { json = (await res.json()) as Record<string, unknown> } catch { return fail(res.status === 401 ? 'invalid_key' : res.status >= 500 ? 'unavailable' : 'bad_response') }
    if (!json || typeof json !== 'object') return fail('bad_response')
    if (res.status === 401) return fail('invalid_key')
    if (json.result === 'success') return { ok: true, data: json }
    // خطا: کد عددی (در messageids یا code) یا متن پیام
    const num = [json.messageids, json.code].map((x) => Number(x)).find((x) => Number.isInteger(x) && x > 0 && x < 1000)
    if (num !== undefined && BY_CODE[num]) return fail(BY_CODE[num], num)
    if (typeof json.message === 'string' && /template/i.test(json.message)) return fail('template_invalid')
    return fail(res.status >= 500 ? 'unavailable' : 'unknown', num)
  }

  return {
    /** ارسال کد با قالب آماده. موفقیت: messageids بزرگ‌تر از ۱۰۰۰ (طبق مستند)، وگرنه کد خطا */
    async sendVerify(phone: string, code: string, template: string): Promise<SmsResult<{ messageId: number }>> {
      const r = await call('/v2/send/verify', { type: 1, receptor: phone, template, param1: code })
      if (!r.ok) return r
      const id = Number(r.data.messageids)
      if (!Number.isFinite(id) || id <= 1000) return fail(BY_CODE[id] ?? 'unknown', Number.isFinite(id) ? id : undefined)
      return { ok: true, data: { messageId: id } }
    },
    async credit(): Promise<SmsResult<{ credit: number }>> {
      const r = await call('/v2/credit', {}); if (!r.ok) return r
      const credit = Number(r.data.credit)
      return Number.isFinite(credit) ? { ok: true, data: { credit } } : fail('bad_response')
    },
  }
}
export type Ghasedak = ReturnType<typeof createGhasedak>
