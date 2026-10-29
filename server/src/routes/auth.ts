import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Config } from '../config.js'
import type { AuthService } from '../auth/service.js'
import { publicUser, PURPOSES } from '../auth/service.js'
import type { Registry } from '../auth/registry.js'

export const SESSION_COOKIE = 'tp_session'
const readCookie = (req: FastifyRequest, name: string) => {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) { try { return decodeURIComponent(part.slice(i + 1).trim()) } catch { return undefined } }
  }
  return undefined
}
/** نشست: HttpOnly (جاوااسکریپت نمی‌بیند)، SameSite=Lax، در production فقط روی HTTPS */
const cookie = (value: string, maxAgeS: number, secure: boolean) => `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeS}${secure ? '; Secure' : ''}`

const phoneBody = z.object({ phone: z.string().max(40), purpose: z.enum(PURPOSES).optional() })
const ID_RE = /^[A-Za-z0-9_-]{8,80}$/ // شناسه‌های تصادفی برنامه؛ هر چیز دیگر (فاصله، نمادهای عجیب) رد می‌شود
const installBody = z.object({ installation_id: z.string().regex(ID_RE), analytics_id: z.string().regex(ID_RE).optional(), platform: z.enum(['web', 'pwa']).default('web'), app_version: z.string().max(30).default('') })
// خزنده‌ها، ابزارهای سنجش سرعت و پایش آنلاین حافظهٔ ماندگار ندارند و هر بازدیدشان یک «نصب تازه» می‌ساخت
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|httpclient|go-http|node-fetch|axios|postman/i
const PUSH_HOST_RE = /^(fcm\.googleapis\.com|android\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/
const b64u = z.string().regex(/^[A-Za-z0-9_-]{8,200}={0,2}$/)
const pushBody = z.object({ installation_id: z.string().regex(ID_RE), subscription: z.object({ endpoint: z.string().max(600), keys: z.object({ p256dh: b64u, auth: b64u }) }) })
const profileBody = z.object({ first_name: z.string().trim().min(1).max(60), last_name: z.string().trim().min(1).max(60), city: z.string().trim().min(1).max(60), email: z.union([z.string().trim().email().max(120), z.literal('')]).optional() })
const verifyBody = z.object({ phone: z.string().max(40), code: z.string().max(12), anonymous_id: z.string().min(1).max(80).optional(), installation_id: z.string().min(8).max(80).optional() })

/** مسیرهای عمومی ورود. درخواست‌های تغییردهنده با Origin غیرهم‌مبدأ رد می‌شوند (دفاع اضافه در کنار SameSite). */
export function authRoutes(app: FastifyInstance, d: { config: Config; auth: AuthService; registry: Registry }) {
  const { config, auth, registry } = d, secure = config.NODE_ENV === 'production'
  const sameOrigin = (req: FastifyRequest) => {
    const o = req.headers.origin
    if (!o) return true
    try { return new URL(o).host === String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '') } catch { return false }
  }
  const guard = (req: FastifyRequest, reply: FastifyReply) => (sameOrigin(req) ? false : (reply.code(403).send({ error: 'forbidden_origin' }), true))
  const token = (req: FastifyRequest) => readCookie(req, SESSION_COOKIE)

  app.get('/auth/config', async () => ({ sms: await auth.canLogin() }))

  app.post('/auth/otp/request', { bodyLimit: 2048, config: { rateLimit: { max: 8, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (guard(req, reply)) return
    const b = phoneBody.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid_phone' })
    const r = await auth.requestOtp(b.data.phone, b.data.purpose ?? 'login')
    if (r.ok) return { ok: true, expires_in: r.expiresIn, resend_in: r.resendIn, ...(r.devCode ? { dev_code: r.devCode } : {}) }
    switch (r.error) {
      case 'invalid_phone': return reply.code(400).send({ error: 'invalid_phone' })
      case 'sms_unavailable': return reply.code(503).send({ error: 'sms_unavailable' })
      case 'too_soon': case 'too_many': return reply.code(429).header('Retry-After', String(r.retryAfter ?? 60)).send({ error: r.error, retry_after: r.retryAfter ?? 60 })
      default: return reply.code(502).send({ error: 'sms_failed' }) // علت دقیق (اعتبار، کلید …) فقط در پنل مدیریت دیده می‌شود
    }
  })

  app.post('/auth/otp/verify', { bodyLimit: 2048, config: { rateLimit: { max: 12, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (guard(req, reply)) return
    const b = verifyBody.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid' })
    const r = await auth.verifyOtp(b.data.phone, b.data.code, b.data.anonymous_id, b.data.installation_id ?? b.data.anonymous_id)
    if (r.ok) { reply.header('Set-Cookie', cookie(r.token, r.maxAgeS, secure)); return { user: r.user, created: r.created } }
    switch (r.error) {
      case 'invalid': return reply.code(400).send({ error: 'invalid' })
      case 'expired': return reply.code(410).send({ error: 'expired' })
      case 'wrong_code': return reply.code(401).send({ error: 'wrong_code', attempts_left: r.attemptsLeft })
      default: return reply.code(429).send({ error: 'locked' })
    }
  })

  // ثبت اولین نصب: هر نصب جدید همان لحظه در پنل مدیریت «مهمان» ثبت می‌شود (بدون هیچ اطلاعات شخصی)
  app.post('/installations', { bodyLimit: 1024, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (guard(req, reply)) return
    const b = installBody.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid' })
    if (BOT_RE.test(String(req.headers['user-agent'] ?? ''))) return reply.code(204).send() // ربات: بی‌صدا ثبت نمی‌شود
    await registry.touchInstall(b.data.installation_id, b.data.platform, b.data.app_version, b.data.analytics_id)
    return reply.code(204).send()
  })

  // اشتراک Web Push برای پیشنهادهای تبلیغاتی: برنامه فقط وقتی مجوز اعلان داده شده و رضایت تبلیغاتی روشن است می‌فرستد.
  // آدرس اشتراک فقط از سرویس‌های Push شناخته‌شدهٔ مرورگرها پذیرفته می‌شود (سرور بعداً به همین آدرس درخواست می‌زند؛ جلوگیری از SSRF).
  app.post('/push/subscribe', { bodyLimit: 4096, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (guard(req, reply)) return
    const b = pushBody.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid' })
    let host = ''
    try { const u = new URL(b.data.subscription.endpoint); if (u.protocol === 'https:' && !u.username && !u.password && !u.port) host = u.hostname } catch { /* نامعتبر */ }
    if (!PUSH_HOST_RE.test(host)) return reply.code(400).send({ error: 'invalid_endpoint' })
    const ok = await registry.setPush(b.data.installation_id, { endpoint: b.data.subscription.endpoint, p256dh: b.data.subscription.keys.p256dh, auth: b.data.subscription.keys.auth })
    return ok ? reply.code(204).send() : reply.code(404).send({ error: 'unknown_install' })
  })
  app.post('/push/unsubscribe', { bodyLimit: 1024, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (guard(req, reply)) return
    const b = z.object({ installation_id: z.string().regex(ID_RE) }).safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid' })
    await registry.setPush(b.data.installation_id, null)
    return reply.code(204).send()
  })

  // تکمیل/ویرایش پروفایل (فقط کاربر واردشده)
  app.put('/auth/profile', { bodyLimit: 2048 }, async (req, reply) => {
    if (guard(req, reply)) return
    const u = await auth.userForToken(token(req)); if (!u) return reply.code(401).send({ error: 'unauthorized' })
    const b = profileBody.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid' })
    const next = await auth.setProfile(u, { first_name: b.data.first_name, last_name: b.data.last_name, city: b.data.city, ...(b.data.email ? { email: b.data.email } : {}) })
    return { user: publicUser(next) }
  })

  app.get('/auth/me', async (req) => { const u = await auth.userForToken(token(req)); return { user: u ? publicUser(u) : null } })

  app.post('/auth/logout', async (req, reply) => {
    if (guard(req, reply)) return
    await auth.logout(token(req))
    return reply.header('Set-Cookie', cookie('', 0, secure)).code(204).send()
  })

  // حذف حساب (الزام فروشگاه‌ها): کاربر و ایندکس شماره پاک می‌شود و همهٔ نشست‌های او بی‌اعتبار می‌شود
  app.delete('/auth/account', async (req, reply) => {
    if (guard(req, reply)) return
    const u = await auth.userForToken(token(req)); if (!u) return reply.code(401).send({ error: 'unauthorized' })
    await auth.deleteAccount(u, token(req))
    return reply.header('Set-Cookie', cookie('', 0, secure)).code(204).send()
  })
}
