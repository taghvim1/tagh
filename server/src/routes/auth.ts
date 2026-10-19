import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Config } from '../config.js'
import type { AuthService } from '../auth/service.js'
import { publicUser } from '../auth/service.js'

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

const phoneBody = z.object({ phone: z.string().max(40) })
const verifyBody = z.object({ phone: z.string().max(40), code: z.string().max(12), anonymous_id: z.string().min(1).max(80).optional() })

/** مسیرهای عمومی ورود. درخواست‌های تغییردهنده با Origin غیرهم‌مبدأ رد می‌شوند (دفاع اضافه در کنار SameSite). */
export function authRoutes(app: FastifyInstance, d: { config: Config; auth: AuthService }) {
  const { config, auth } = d, secure = config.NODE_ENV === 'production'
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
    const r = await auth.requestOtp(b.data.phone)
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
    const r = await auth.verifyOtp(b.data.phone, b.data.code, b.data.anonymous_id)
    if (r.ok) { reply.header('Set-Cookie', cookie(r.token, r.maxAgeS, secure)); return { user: r.user, created: r.created } }
    switch (r.error) {
      case 'invalid': return reply.code(400).send({ error: 'invalid' })
      case 'expired': return reply.code(410).send({ error: 'expired' })
      case 'wrong_code': return reply.code(401).send({ error: 'wrong_code', attempts_left: r.attemptsLeft })
      default: return reply.code(429).send({ error: 'locked' })
    }
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
