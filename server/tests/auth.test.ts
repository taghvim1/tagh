import { createHash } from 'node:crypto'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { normalizeIranMobile } from '../src/auth/phone.js'
import { loadConfig } from '../src/config.js'
import { createJsonStore } from '../src/store/jsonStore.js'

const KEY = 'test-ghasedak-key-1234567890'
const PHONE = '09121234567'
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

interface Call { url: string; apikey: string | undefined; contentType: string | undefined; body: URLSearchParams }
type Responder = (url: string, body: URLSearchParams) => { status?: number; json?: unknown; throws?: boolean }
const ok: Responder = (url) => {
  if (url.endsWith('/v2/send/verify')) return { json: { result: 'success', messageids: 11509774 } }
  if (url.endsWith('/v2/credit')) return { json: { result: 'success', credit: 9190153.0 } }
  if (url.endsWith('/v2/sms/otp/create')) return { json: { result: 'success', templateid: 9421 } }
  if (url.endsWith('/v2/sms/otp/status')) return { json: { result: 'success', status: 1 } }
  return { status: 404, json: { result: 'error' } }
}

let app: FastifyInstance
const bodies: string[] = [] // همهٔ پاسخ‌ها: کلید نباید در هیچ‌کدام باشد
afterEach(async () => { await app?.close() })

async function mk(env: Record<string, string> = {}, responder: Responder = ok) {
  const calls: Call[] = [], clock = { t: Date.UTC(2026, 9, 17, 12, 0, 0) }
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = new URLSearchParams(String(init?.body ?? '')), h = new Headers(init?.headers)
    calls.push({ url: String(url), apikey: h.get('apikey') ?? undefined, contentType: h.get('content-type') ?? undefined, body })
    const r = responder(String(url), body)
    if (r.throws) throw new Error('boom')
    return new Response(JSON.stringify(r.json ?? {}), { status: r.status ?? 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch
  const store = await createJsonStore()
  const vars: Record<string, string | undefined> = { NODE_ENV: 'test', STATIC_DIR: '/x', SECRETS_ENCRYPTION_KEY: 'k'.repeat(32), GHASEDAK_API_KEY: KEY, ...env }
  for (const k of Object.keys(vars)) if (vars[k] === '') delete vars[k] // «''» یعنی متغیر تنظیم نشده
  app = await buildApp({ config: loadConfig(vars), fetchImpl, store, now: () => clock.t })
  const call = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown, headers: Record<string, string> = {}) => {
    const r = await app.inject({ method, url, payload: payload as object | undefined, headers })
    bodies.push(r.body); return r
  }
  const cookieOf = (r: LightMyRequestResponse) => String(r.headers['set-cookie'] ?? '')
  const sessionHeader = (r: LightMyRequestResponse) => ({ cookie: cookieOf(r).split(';')[0] })
  const codeSent = () => calls.filter((c) => c.url.endsWith('/v2/send/verify')).at(-1)!.body.get('param1')!
  const login = async (phone = PHONE) => {
    expect((await call('POST', '/api/auth/otp/request', { phone })).statusCode).toBe(200)
    return call('POST', '/api/auth/otp/verify', { phone, code: codeSent() })
  }
  return { calls, clock, store, call, cookieOf, sessionHeader, codeSent, login }
}

describe('نرمال‌سازی شماره', () => {
  it('قالب‌های رایج به ۰۹xxxxxxxxx تبدیل می‌شود و بقیه رد می‌شود', () => {
    for (const v of ['09121234567', '9121234567', '+989121234567', '00989121234567', '989121234567', '۰۹۱۲۱۲۳۴۵۶۷', '0912 123 4567', '0912-123-4567', '٠٩١٢١٢٣٤٥٦٧']) expect(normalizeIranMobile(v), v).toBe(PHONE)
    for (const v of ['', '0912', '09121234', '021123456789', '+15551234567', 'abc', '091212345678', null, 123, '0912123456a']) expect(normalizeIranMobile(v), String(v)).toBeNull()
  })
})

describe('ورود با کد پیامکی', () => {
  it('جریان کامل: ارسال با قالب قاصدک، تأیید، کوکی امن، me، خروج', async () => {
    const t = await mk()
    const r = await t.call('POST', '/api/auth/otp/request', { phone: '۰۹۱۲-۱۲۳-۴۵۶۷' })
    expect(r.statusCode).toBe(200); expect(r.json()).toMatchObject({ ok: true, expires_in: 120, resend_in: 60 }); expect(r.json().dev_code).toBeUndefined()
    const c = t.calls.at(-1)!
    expect(c.url).toBe('https://api.ghasedaksms.com/v2/send/verify'); expect(c.apikey).toBe(KEY); expect(c.contentType).toContain('x-www-form-urlencoded')
    expect(Object.fromEntries(c.body)).toMatchObject({ type: '1', receptor: PHONE, template: 'taghvim-otp' }); expect(c.body.get('param1')).toMatch(/^\d{6}$/)

    const v = await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: t.codeSent() })
    expect(v.statusCode).toBe(200); expect(v.json()).toMatchObject({ created: true, user: { phone_masked: '0912***4567' } })
    expect(JSON.stringify(v.json())).not.toContain(PHONE) // شمارهٔ کامل به کلاینت برنمی‌گردد
    const cookie = t.cookieOf(v)
    expect(cookie).toMatch(/^tp_session=[\w-]{40,};/); expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Lax'); expect(cookie).toContain('Max-Age=2592000')

    expect((await t.call('GET', '/api/auth/me', undefined, t.sessionHeader(v))).json().user).toMatchObject({ phone_masked: '0912***4567' })
    expect((await t.call('GET', '/api/auth/me')).json().user).toBeNull() // بدون کوکی
    const out = await t.call('POST', '/api/auth/logout', undefined, t.sessionHeader(v))
    expect(out.statusCode).toBe(204); expect(t.cookieOf(out)).toContain('Max-Age=0')
    expect((await t.call('GET', '/api/auth/me', undefined, t.sessionHeader(v))).json().user).toBeNull() // نشست سمت سرور هم باطل شد
  })

  it('کد فارسی هم پذیرفته می‌شود؛ کد یک‌بارمصرف است؛ ورود دوم همان کاربر است', async () => {
    const t = await mk()
    const a = await t.login()
    const fa = t.codeSent().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    expect(a.statusCode).toBe(200)
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: t.codeSent() })).statusCode).toBe(410) // دوباره استفاده از همان کد
    t.clock.t += 61_000
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const code2 = t.codeSent(), fa2 = code2.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    const b = await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: fa2 })
    expect(b.statusCode).toBe(200); expect(b.json().created).toBe(false); expect(b.json().user.id).toBe(a.json().user.id)
    void fa
  })

  it('کد فقط به‌صورت HMAC ذخیره می‌شود (نه متن ساده)', async () => {
    const t = await mk()
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const rec = JSON.parse((await t.store.getKV(`auth:otp:${sha(PHONE)}`))!)
    expect(rec.hash).toMatch(/^[0-9a-f]{64}$/); expect(Object.values(rec).map(String)).not.toContain(t.codeSent())
    expect(rec.expires_at).toBe(t.clock.t + 120_000)
  })

  it('تلاش اشتباه: شمارنده، قفل پس از ۵ بار و باطل‌شدن کد', async () => {
    const t = await mk()
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const right = t.codeSent(), wrong = right === '000000' ? '111111' : '000000'
    for (const left of [4, 3, 2, 1]) {
      const r = await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: wrong })
      expect(r.statusCode).toBe(401); expect(r.json()).toEqual({ error: 'wrong_code', attempts_left: left })
    }
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: wrong })).statusCode).toBe(429)
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: right })).statusCode).toBe(410) // حتی کد درست دیگر کار نمی‌کند
  })

  it('انقضای ۲ دقیقه‌ای و ورودی نامعتبر', async () => {
    const t = await mk()
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const code = t.codeSent()
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: '12' })).statusCode).toBe(400)
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: 'x', code })).statusCode).toBe(400)
    t.clock.t += 121_000
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code })).statusCode).toBe(410)
  })

  it('فاصلهٔ ۶۰ ثانیه بین ارسال‌ها و سقف ۵ ارسال در ساعت', async () => {
    const t = await mk()
    expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(200)
    const soon = await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    expect(soon.statusCode).toBe(429); expect(soon.json()).toMatchObject({ error: 'too_soon' }); expect(soon.json().retry_after).toBeGreaterThan(0); expect(soon.json().retry_after).toBeLessThanOrEqual(60)
    expect(t.calls.length).toBe(1) // درخواست زودهنگام پیامک نفرستاد
    for (let i = 0; i < 4; i++) { t.clock.t += 61_000; expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(200) }
    t.clock.t += 61_000
    const many = await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    expect(many.statusCode).toBe(429); expect(many.json().error).toBe('too_many'); expect(t.calls.length).toBe(5)
    t.clock.t += 3_600_000
    expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(200) // پنجرهٔ ساعتی گذشت
  })

  it('شمارهٔ نامعتبر پیامک نمی‌فرستد', async () => {
    const t = await mk()
    for (const phone of ['123', '+15551234567', '']) expect((await t.call('POST', '/api/auth/otp/request', { phone })).statusCode).toBe(400)
    expect((await t.call('POST', '/api/auth/otp/request', {})).statusCode).toBe(400)
    expect(t.calls.length).toBe(0)
  })

  it('خطای قاصدک به کاربر فقط «sms_failed» می‌دهد و در سقف‌ها حساب می‌شود', async () => {
    for (const r of [{ json: { result: 'error', messageids: 9 } }, { throws: true }, { status: 500, json: { result: 'error' } }, { json: { result: 'success', messageids: 7 } }] as ReturnType<Responder>[]) {
      const t = await mk({}, () => r)
      const res = await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
      expect(res.statusCode).toBe(502); expect(res.json()).toEqual({ error: 'sms_failed' })
      expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(429) // تلاش بلافاصله دوباره همان سقف را دارد
      await app.close()
    }
  })

  it('بدون کلید یا با غیرفعال‌بودن: 503 و config.sms=false', async () => {
    const t = await mk({ GHASEDAK_API_KEY: '' })
    expect((await t.call('GET', '/api/auth/config')).json()).toEqual({ sms: false })
    expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(503)
    await app.close()
    const t2 = await mk()
    expect((await t2.call('GET', '/api/auth/config')).json()).toEqual({ sms: true })
    expect((await t2.call('PUT', '/api/admin/sms/settings', { templates: [{ name: 'taghvim-otp', purpose: 'login' }], enabled: false })).statusCode).toBe(200)
    expect((await t2.call('GET', '/api/auth/config')).json()).toEqual({ sms: false })
    expect((await t2.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(503)
  })

  it('حالت توسعه: کد فقط در NODE_ENV=development و بدون کلید برمی‌گردد', async () => {
    const dev = await mk({ NODE_ENV: 'development', AUTH_DEV_ECHO: 'true', GHASEDAK_API_KEY: '' })
    const r = await dev.call('POST', '/api/auth/otp/request', { phone: PHONE })
    expect(r.statusCode).toBe(200); expect(r.json().dev_code).toMatch(/^\d{6}$/); expect(dev.calls.length).toBe(0)
    expect((await dev.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: r.json().dev_code })).statusCode).toBe(200)
    await app.close()
    const withKey = await mk({ NODE_ENV: 'development', AUTH_DEV_ECHO: 'true' })
    expect((await withKey.call('POST', '/api/auth/otp/request', { phone: PHONE })).json().dev_code).toBeUndefined() // با کلید، پیامک واقعی
    await app.close()
    const test = await mk({ AUTH_DEV_ECHO: 'true', GHASEDAK_API_KEY: '' }) // test/production هرگز
    expect((await test.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(503)
    await app.close()
    const prod = await mk({ NODE_ENV: 'production', AUTH_DEV_ECHO: 'true', GHASEDAK_API_KEY: '', ADMIN_TOKEN: 'a'.repeat(20) })
    expect((await prod.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(503)
  })

  it('Origin غیرهم‌مبدأ رد می‌شود؛ هم‌مبدأ مجاز است', async () => {
    const t = await mk()
    const evil = await t.call('POST', '/api/auth/otp/request', { phone: PHONE }, { origin: 'https://evil.example', host: 'app.example' })
    expect(evil.statusCode).toBe(403); expect(t.calls.length).toBe(0)
    expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE }, { origin: 'https://app.example', host: 'app.example' })).statusCode).toBe(200)
  })

  it('در production کوکی Secure دارد', async () => {
    const t = await mk({ NODE_ENV: 'production', ADMIN_TOKEN: 'a'.repeat(20) })
    expect(t.cookieOf(await t.login())).toContain('Secure')
  })

  it('anonymous_id (فقط در صورت ارسال کلاینت) به کاربر وصل می‌شود', async () => {
    const t = await mk()
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const v = await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: t.codeSent(), anonymous_id: 'anon_abc' })
    const user = JSON.parse((await t.store.getKV(`auth:user:${v.json().user.id}`))!)
    expect(user.anonymous_ids).toEqual(['anon_abc'])
  })

  it('حذف حساب: نشست‌ها باطل می‌شوند و ورود بعدی کاربر تازه می‌سازد', async () => {
    const t = await mk()
    const v = await t.login()
    const id = v.json().user.id
    expect((await t.call('DELETE', '/api/auth/account')).statusCode).toBe(401) // بدون نشست
    expect((await t.call('DELETE', '/api/auth/account', undefined, t.sessionHeader(v))).statusCode).toBe(204)
    expect((await t.call('GET', '/api/auth/me', undefined, t.sessionHeader(v))).json().user).toBeNull()
    t.clock.t += 61_000
    const again = await t.login()
    expect(again.json().created).toBe(true); expect(again.json().user.id).not.toBe(id)
  })

  it('نشست بعد از ۳۰ روز منقضی می‌شود', async () => {
    const t = await mk()
    const v = await t.login()
    t.clock.t += 31 * 86_400_000
    expect((await t.call('GET', '/api/auth/me', undefined, t.sessionHeader(v))).json().user).toBeNull()
  })
})

describe('پنل مدیریت: ورود پیامکی', () => {
  it('کلید قاصدک از «تنظیمات API» ذخیره می‌شود و فقط ماسک‌شده برمی‌گردد', async () => {
    const t = await mk({ GHASEDAK_API_KEY: '' })
    expect((await t.call('GET', '/api/admin/sms')).json()).toMatchObject({ configured: false, available: false })
    const put = await t.call('PUT', '/api/admin/settings/secrets/ghasedak', { value: KEY })
    expect(put.statusCode).toBe(200); expect(put.json().status).toMatchObject({ configured: true, source: 'ui', masked: '••••7890', env_var: 'GHASEDAK_API_KEY' })
    const s = (await t.call('GET', '/api/admin/sms')).json()
    expect(s).toMatchObject({ configured: true, available: true, base_host: 'api.ghasedaksms.com', https: true, settings: { enabled: true, templates: [{ name: 'taghvim-otp', purpose: 'login' }] } })
    expect((await t.call('POST', '/api/auth/otp/request', { phone: PHONE })).statusCode).toBe(200) // کلید ذخیره‌شده از UI هم استفاده می‌شود
    expect(t.calls.at(-1)!.apikey).toBe(KEY)
  })

  it('تنظیمات: نام قالب نامعتبر رد می‌شود و قالبِ هر وظیفه در ارسال استفاده می‌شود', async () => {
    const t = await mk()
    for (const name of ['قالب', 'ab', 'has space', 'x'.repeat(41)]) expect((await t.call('PUT', '/api/admin/sms/settings', { templates: [{ name, purpose: 'login' }], enabled: true })).statusCode, name).toBe(400)
    const put = (templates: unknown[]) => t.call('PUT', '/api/admin/sms/settings', { templates, enabled: true })
    expect((await put([{ name: 'a-login', purpose: 'reset' }])).statusCode).toBe(400) // قالب «ورود» لازم است
    expect((await put([{ name: 'a-login', purpose: 'login' }, { name: 'A-LOGIN', purpose: 'other' }])).statusCode).toBe(400) // نام تکراری
    expect((await put([{ name: 'a-login', purpose: 'login' }, { name: 'b-login', purpose: 'login' }])).statusCode).toBe(400) // دو قالب برای یک وظیفه
    const r = await put([{ name: 'my-otp_2', purpose: 'login' }, { name: 'my-reset', purpose: 'reset' }, { name: 'promo-1', purpose: 'other', label: 'تبلیغ' }])
    expect(r.json()).toMatchObject({ settings: { enabled: true, templates: [{ name: 'my-otp_2', purpose: 'login' }, { name: 'my-reset', purpose: 'reset' }, { name: 'promo-1', purpose: 'other', label: 'تبلیغ' }] }, available: true })
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    expect(t.calls.at(-1)!.body.get('template')).toBe('my-otp_2')
    t.clock.t += 61_000
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE, purpose: 'reset' })
    expect(t.calls.at(-1)!.body.get('template')).toBe('my-reset')
    // ارسال آزمایشی با قالب انتخابی
    const id = (r.json().settings.templates as { id: string; name: string }[]).find((x) => x.name === 'promo-1')!.id
    await t.call('POST', '/api/admin/sms/test-send', { phone: PHONE, template_id: id })
    expect(t.calls.at(-1)!.body.get('template')).toBe('promo-1')
    expect((await t.call('POST', '/api/admin/sms/test-send', { phone: PHONE, template_id: 'nope' })).statusCode).toBe(400)
  })

  it('تنظیمات قدیمی (فقط یک نام قالب) به قالب «ورود» مهاجرت می‌کند و ریست بدون قالب جدا از قالب ورود استفاده می‌کند', async () => {
    const t = await mk()
    await t.store.setKV('auth:sms_settings', JSON.stringify({ template: 'legacy-otp', enabled: true }))
    expect((await t.call('GET', '/api/admin/sms')).json().settings).toMatchObject({ enabled: true, templates: [{ name: 'legacy-otp', purpose: 'login' }] })
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE, purpose: 'reset' })
    expect(t.calls.at(-1)!.body.get('template')).toBe('legacy-otp')
  })

  it('ارسال آزمایشی: موفق، شمارهٔ نامعتبر، و خطاهای قاصدک با پیام فارسی', async () => {
    const t = await mk()
    const r = await t.call('POST', '/api/admin/sms/test-send', { phone: '0912 123 4567' })
    expect(r.statusCode).toBe(200); expect(r.json()).toMatchObject({ ok: true, message_id: 11509774 }); expect(t.calls.at(-1)!.body.get('receptor')).toBe(PHONE)
    expect((await t.call('POST', '/api/admin/sms/test-send', { phone: '12' })).statusCode).toBe(400)
    // ارسال آزمایشی کد ورود را ذخیره نمی‌کند
    expect(await t.store.getKV(`auth:otp:${sha(PHONE)}`)).toBeNull()
    await app.close()
    const cases: [number, string, string][] = [[9, 'no_credit', 'اعتبار'], [8, 'invalid_number', 'نامعتبر'], [20, 'filtered_number', 'فیلتر'], [11, 'ip_not_allowed', 'آی‌پی'], [6, 'invalid_key', 'کلید']]
    for (const [code, kind, word] of cases) {
      const e = await mk({}, () => ({ json: { result: 'error', messageids: code } }))
      const res = await e.call('POST', '/api/admin/sms/test-send', { phone: PHONE })
      expect(res.statusCode, kind).toBe(502); expect(res.json()).toMatchObject({ ok: false, error: kind }); expect(res.json().message).toContain(word)
      await app.close()
    }
    const inv = await mk({}, () => ({ json: { result: 'error', message: 'invalid template' } }))
    expect((await inv.call('POST', '/api/admin/sms/test-send', { phone: PHONE })).json().error).toBe('template_invalid')
    await app.close()
    const nokey = await mk({ GHASEDAK_API_KEY: '' })
    expect((await nokey.call('POST', '/api/admin/sms/test-send', { phone: PHONE })).json().error).toBe('not_configured')
  })

  it('اعتبار حساب؛ و مسیرهای ساخت/وضعیت قالب دیگر وجود ندارند (قالب فقط در پنل قاصدک ساخته می‌شود)', async () => {
    const t = await mk()
    expect((await t.call('POST', '/api/admin/sms/credit')).json()).toEqual({ ok: true, credit_rial: 9190153 })
    expect((await t.call('POST', '/api/admin/sms/template', { name: 'new-otp', message: 'کد: %param1%' })).statusCode).toBe(404)
    expect((await t.call('POST', '/api/admin/sms/template/status', { template_id: 1 })).statusCode).toBe(404)
  })

  it('«تست کلید» در تنظیمات API فقط اعتبار می‌پرسد (پیامک نمی‌فرستد)', async () => {
    const t = await mk()
    const r = await t.call('POST', '/api/admin/settings/test/ghasedak')
    expect(r.json()).toMatchObject({ ok: true }); expect(r.json().message).toContain('9,190,153')
    expect(t.calls.map((c) => c.url)).toEqual(['https://api.ghasedaksms.com/v2/credit'])
  })

  it('گزارش ارسال: فقط شمارهٔ ماسک‌شده و بدون کد', async () => {
    const t = await mk()
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    await t.call('POST', '/api/admin/sms/test-send', { phone: '09351112233' })
    const log = (await t.call('GET', '/api/admin/sms')).json().log
    expect(log.map((l: { kind: string; phone_masked: string }) => [l.kind, l.phone_masked])).toEqual([['test', '0935***2233'], ['login', '0912***4567']])
    expect(JSON.stringify(log)).not.toContain(t.calls[0].body.get('param1')!)
  })

  it('با ADMIN_TOKEN بدون توکن دسترسی ندارد', async () => {
    const t = await mk({ ADMIN_TOKEN: 'a'.repeat(20) })
    expect((await t.call('GET', '/api/admin/sms')).statusCode).toBe(401)
    expect((await t.call('POST', '/api/admin/sms/test-send', { phone: PHONE })).statusCode).toBe(401)
    expect((await t.call('GET', '/api/admin/sms', undefined, { authorization: `Bearer ${'a'.repeat(20)}` })).statusCode).toBe(200)
    expect(t.calls.length).toBe(0)
  })

  it('کلید در هیچ پاسخی نیست', () => {
    expect(bodies.length).toBeGreaterThan(20)
    expect(bodies.filter((b) => b.includes(KEY))).toEqual([])
  })
})

describe('ثبت نصب، ثبت‌نام و تکمیل پروفایل در پنل کاربران', () => {
  const INST = 'inst-abcdef123456'
  const same = { origin: 'http://localhost:80', host: 'localhost:80' }

  it('نصب تازه مهمان ثبت می‌شود؛ ورود با شماره آن را «ثبت‌نام‌شده» و تکمیل پروفایل آن را «کامل» می‌کند', async () => {
    const t = await mk()
    expect((await t.call('POST', '/api/installations', { installation_id: INST, platform: 'pwa', app_version: '1.2.3' })).statusCode).toBe(204)
    await t.call('POST', '/api/installations', { installation_id: INST }) // دوباره باز شدن: ردیف تازه نمی‌سازد
    expect((await t.call('POST', '/api/installations', { installation_id: 'x' })).statusCode).toBe(400)
    let st = (await t.call('GET', '/api/admin/users/stats')).json()
    expect(st).toMatchObject({ total: 1, guests: 1, registered: 0 })
    const list0 = (await t.call('GET', '/api/admin/users')).json()
    expect(list0.items).toHaveLength(1); expect(list0.items[0]).toMatchObject({ id: INST, status: 'guest', profile_complete: false })

    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    const v = await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: t.codeSent(), installation_id: INST })
    expect(v.statusCode).toBe(200); expect(v.json().user).toMatchObject({ profile: null, profile_complete: false })
    st = (await t.call('GET', '/api/admin/users/stats')).json()
    expect(st).toMatchObject({ total: 1, guests: 0, registered: 1, complete: 0, incomplete: 1 }) // همان ردیف، نه ردیف جدید
    const uid = v.json().user.id as string
    const reg = (await t.call('GET', '/api/admin/users?q=' + encodeURIComponent(JSON.stringify({ filters: { status: 'registered' } })))).json()
    expect(reg.items[0]).toMatchObject({ id: uid, status: 'registered', phone_masked: '0912***567', profile_complete: false })

    const h = t.sessionHeader(v)
    expect((await t.call('PUT', '/api/auth/profile', { first_name: 'علی', last_name: '', city: 'تهران' }, h)).statusCode).toBe(400)
    expect((await t.call('PUT', '/api/auth/profile', { first_name: 'علی', last_name: 'رضایی', city: 'تهران' })).statusCode).toBe(401)
    const p = await t.call('PUT', '/api/auth/profile', { first_name: 'علی', last_name: 'رضایی', city: 'تهران', email: '' }, h)
    expect(p.statusCode).toBe(200); expect(p.json().user).toMatchObject({ profile: { first_name: 'علی', last_name: 'رضایی', city: 'تهران' }, profile_complete: true })
    expect((await t.call('GET', '/api/auth/me', undefined, h)).json().user.profile_complete).toBe(true)
    expect((await t.call('GET', '/api/admin/users/stats')).json()).toMatchObject({ registered: 1, complete: 1, incomplete: 0 })
    const d = (await t.call('GET', `/api/admin/users/${uid}?contact=1`)).json()
    expect(d).toMatchObject({ display_name: 'علی رضایی', city: 'تهران', profile_complete: true, contact: { phone: PHONE } })

    // ورود دوباره (مثلاً دستگاه دیگر) پروفایل را حفظ می‌کند و ردیف جدید نمی‌سازد
    t.clock.t += 61_000
    const again = await t.login()
    expect(again.json().user.profile_complete).toBe(true)
    expect((await t.call('GET', '/api/admin/users/stats')).json().total).toBe(1)
    void same
  })

  it('ورود بدون ثبت نصب هم ردیف ثبت‌نام‌شده می‌سازد؛ غیرفعال‌سازی مانع ورود می‌شود؛ حذف از پنل حساب را پاک می‌کند', async () => {
    const t = await mk()
    const v = await t.login(); const uid = v.json().user.id as string
    expect((await t.call('GET', '/api/admin/users/stats')).json()).toMatchObject({ total: 1, registered: 1 })
    expect((await t.call('POST', `/api/admin/users/${uid}/disable`, { confirm: 'wrong' })).statusCode).toBe(400)
    expect((await t.call('POST', `/api/admin/users/${uid}/disable`, { confirm: uid })).statusCode).toBe(200)
    expect((await t.call('GET', '/api/auth/me', undefined, t.sessionHeader(v))).json().user).toBeNull()
    t.clock.t += 61_000
    await t.call('POST', '/api/auth/otp/request', { phone: PHONE })
    expect((await t.call('POST', '/api/auth/otp/verify', { phone: PHONE, code: t.codeSent() })).statusCode).toBe(429)
    expect((await t.call('DELETE', `/api/admin/users/${uid}`, { confirm: uid })).statusCode).toBe(200)
    expect((await t.call('GET', '/api/admin/users/stats')).json().total).toBe(0)
    expect((await t.call('GET', `/api/admin/users/${uid}`)).statusCode).toBe(404)
  })

  it('حذف حساب توسط خود کاربر، ردیفش را از پنل هم برمی‌دارد', async () => {
    const t = await mk()
    const v = await t.login()
    expect((await t.call('DELETE', '/api/auth/account', undefined, t.sessionHeader(v))).statusCode).toBe(204)
    expect((await t.call('GET', '/api/admin/users/stats')).json().total).toBe(0)
  })
})
