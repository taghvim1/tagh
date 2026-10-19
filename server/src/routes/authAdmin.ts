import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Config } from '../config.js'
import type { Ghasedak } from '../auth/ghasedak.js'
import { SMS_ERROR_FA } from '../auth/ghasedak.js'
import { DEFAULT_TEMPLATE_NAME, DEFAULT_TEMPLATE_TEXT, type AuthService } from '../auth/service.js'
import { issuesOf } from '../domain/schema.js'

const templateName = z.string().trim().regex(/^[A-Za-z0-9_-]{3,40}$/, 'نام قالب فقط حروف انگلیسی، عدد، «-» و «_» (۳ تا ۴۰ نویسه)؛ بدون حروف فارسی.')
const bad = (errors: string[]) => ({ error: 'validation', errors })

/** ابزار ورود پیامکی در پنل مدیریت: وضعیت، تنظیم قالب، ساخت قالب، اعتبار و ارسال آزمایشی. زیر همان محافظ ادمین ثبت می‌شود. */
export function smsAdminRoutes(adm: FastifyInstance, d: { config: Config; auth: AuthService; sms: Ghasedak }) {
  const { config, auth, sms } = d
  const rate = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  adm.get('/sms', async () => {
    const st = await auth.status()
    let host = ''; try { host = new URL(config.GHASEDAK_BASE_URL).host } catch { /* نامعتبر */ }
    return { configured: st.configured, settings: st.settings, available: st.available, base_host: host, https: config.GHASEDAK_BASE_URL.startsWith('https://'), default_template: { name: DEFAULT_TEMPLATE_NAME, text: DEFAULT_TEMPLATE_TEXT }, log: await auth.readLog() }
  })

  adm.put('/sms/settings', async (req, reply) => {
    const b = z.object({ template: templateName, enabled: z.boolean() }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(issuesOf(b.error)))
    await auth.saveSettings(b.data)
    const st = await auth.status()
    return { settings: st.settings, available: st.available }
  })

  adm.post('/sms/test-send', rate, async (req, reply) => {
    const b = z.object({ phone: z.string().max(40) }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(['شمارهٔ موبایل لازم است.']))
    const r = await auth.testSend(b.data.phone)
    if (r.ok) return { ok: true, message_id: r.messageId, message: 'پیامک آزمایشی ارسال شد (کد آن ذخیره نمی‌شود و برای ورود معتبر نیست).' }
    if (r.error === 'invalid_phone') return reply.code(400).send(bad(['شمارهٔ موبایل معتبر نیست (مثل ۰۹۱۲۱۲۳۴۵۶۷).']))
    return reply.code(502).send({ ok: false, error: r.error, message: r.message })
  })

  adm.post('/sms/credit', rate, async (_req, reply) => {
    const r = await sms.credit()
    return r.ok ? { ok: true, credit_rial: r.data.credit } : reply.code(502).send({ ok: false, error: r.error, message: r.message })
  })

  adm.post('/sms/template', rate, async (req, reply) => {
    const b = z.object({ name: templateName, message: z.string().trim().min(5).max(300).refine((m) => m.includes('%param1%'), 'متن قالب باید حتماً %param1% (جای کد) را داشته باشد.'), apply: z.boolean().default(true) }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(issuesOf(b.error)))
    const r = await sms.createTemplate(b.data.name, b.data.message)
    if (!r.ok) return reply.code(502).send({ ok: false, error: r.error, message: r.message })
    if (b.data.apply) await auth.saveSettings({ ...(await auth.loadSettings()), template: b.data.name })
    return { ok: true, template_id: r.data.templateId, applied: b.data.apply, message: 'قالب ساخته شد؛ تا تأیید قاصدک ممکن است ارسال با آن ناموفق باشد (وضعیت را بررسی کنید).' }
  })

  adm.post('/sms/template/status', rate, async (req, reply) => {
    const b = z.object({ template_id: z.coerce.number().int().positive() }).safeParse(req.body)
    if (!b.success) return reply.code(400).send(bad(['شناسهٔ قالب معتبر نیست.']))
    const r = await sms.templateStatus(b.data.template_id)
    return r.ok ? { ok: true, status: r.data.status } : reply.code(502).send({ ok: false, error: r.error, message: r.message })
  })

  void SMS_ERROR_FA
}
