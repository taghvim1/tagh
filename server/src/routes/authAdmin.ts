import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Config } from '../config.js'
import type { Ghasedak } from '../auth/ghasedak.js'
import { SMS_ERROR_FA } from '../auth/ghasedak.js'
import { DEFAULT_TEMPLATE_NAME, PURPOSES, PURPOSE_FA, type AuthService } from '../auth/service.js'
import { issuesOf } from '../domain/schema.js'

const templateName = z.string().trim().regex(/^[A-Za-z0-9_-]{3,40}$/, 'نام قالب فقط حروف انگلیسی، عدد، «-» و «_» (۳ تا ۴۰ نویسه)؛ بدون حروف فارسی.')
const bad = (errors: string[]) => ({ error: 'validation', errors })

/** ابزار ورود پیامکی در پنل مدیریت: وضعیت، فهرست نام قالب‌ها و وظیفهٔ هر کدام، اعتبار و ارسال آزمایشی. (خود قالب فقط در پنل قاصدک ساخته و تأیید می‌شود.) زیر همان محافظ ادمین ثبت می‌شود. */
export function smsAdminRoutes(adm: FastifyInstance, d: { config: Config; auth: AuthService; sms: Ghasedak }) {
  const { config, auth, sms } = d
  const rate = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  adm.get('/sms', async () => {
    const st = await auth.status()
    let host = ''; try { host = new URL(config.GHASEDAK_BASE_URL).host } catch { /* نامعتبر */ }
    return { configured: st.configured, settings: st.settings, available: st.available, base_host: host, https: config.GHASEDAK_BASE_URL.startsWith('https://'), default_template: DEFAULT_TEMPLATE_NAME, purposes: PURPOSES.map((id) => ({ id, label: PURPOSE_FA[id] })), log: await auth.readLog() }
  })

  adm.put('/sms/settings', async (req, reply) => {
    const b = z.object({
      enabled: z.boolean(),
      templates: z.array(z.object({ name: templateName, purpose: z.enum(PURPOSES), label: z.string().trim().max(40).optional() })).min(1, 'حداقل یک قالب لازم است.').max(20),
    }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(issuesOf(b.error)))
    const names = b.data.templates.map((t) => t.name.toLowerCase())
    if (new Set(names).size !== names.length) return reply.code(400).send(bad(['نام قالب‌ها نباید تکراری باشد.']))
    for (const p of ['login', 'reset'] as const) if (b.data.templates.filter((t) => t.purpose === p).length > 1) return reply.code(400).send(bad([`برای وظیفهٔ «${PURPOSE_FA[p]}» فقط یک قالب می‌شود.`]))
    if (!b.data.templates.some((t) => t.purpose === 'login')) return reply.code(400).send(bad(['یک قالب برای «ثبت‌نام و ورود» لازم است.']))
    await auth.saveSettings({ enabled: b.data.enabled, templates: b.data.templates.map((t, i) => ({ id: `t${i + 1}-${t.name}`, name: t.name, purpose: t.purpose, ...(t.label ? { label: t.label } : {}) })) })
    const st = await auth.status()
    return { settings: st.settings, available: st.available }
  })

  adm.post('/sms/test-send', rate, async (req, reply) => {
    const b = z.object({ phone: z.string().max(40), template_id: z.string().max(80).optional() }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(['شمارهٔ موبایل لازم است.']))
    const r = await auth.testSend(b.data.phone, b.data.template_id)
    if (r.ok) return { ok: true, message_id: r.messageId, message: 'پیامک آزمایشی ارسال شد (کد آن ذخیره نمی‌شود و برای ورود معتبر نیست).' }
    if (r.error === 'invalid_phone') return reply.code(400).send(bad(['شمارهٔ موبایل معتبر نیست (مثل ۰۹۱۲۱۲۳۴۵۶۷).']))
    if (r.error === 'unknown_template') return reply.code(400).send(bad(['قالب انتخاب‌شده پیدا نشد؛ ابتدا تنظیمات را ذخیره کنید.']))
    return reply.code(502).send({ ok: false, error: r.error, message: 'message' in r ? r.message : '' })
  })

  adm.post('/sms/credit', rate, async (_req, reply) => {
    const r = await sms.credit()
    return r.ok ? { ok: true, credit_rial: r.data.credit } : reply.code(502).send({ ok: false, error: r.error, message: r.message })
  })

  void SMS_ERROR_FA
}
