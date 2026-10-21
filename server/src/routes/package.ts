import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { issuesOf } from '../domain/schema.js'
import { DEFAULT_PACKAGE_PROMPT, validatePackagePrompt } from '../package/prompt.js'
import { BUDGETS, packageInput, TRIP_TYPES, VEHICLES } from '../package/schema.js'
import type { PackageService } from '../package/service.js'

const ERR: Record<string, [number, string]> = {
  disabled: [503, 'طراحی پکیج فعلاً در دسترس نیست.'], not_configured: [503, 'طراحی پکیج فعلاً در دسترس نیست.'],
  quota: [503, 'ظرفیت سرویس موقتاً پر است؛ کمی بعد دوباره امتحان کنید.'], unavailable: [502, 'سرویس پاسخ نداد؛ دوباره امتحان کنید.'], bad_output: [502, 'طراحی پکیج این بار موفق نشد؛ دوباره امتحان کنید.'],
}

export function packagePublicRoutes(app: FastifyInstance, pkg: PackageService) {
  app.get('/package/options', async () => ({ budgets: BUDGETS, vehicles: VEHICLES, trip_types: TRIP_TYPES, enabled: (await pkg.settings()).enabled }))
  // هر درخواست هزینهٔ AI دارد؛ سقف سخت‌گیرانه برای هر IP
  app.post('/package', { bodyLimit: 2048, config: { rateLimit: { max: 4, timeWindow: '1 minute' } } }, async (req, reply) => {
    const b = packageInput.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid', errors: issuesOf(b.error) })
    const r = await pkg.generate(b.data)
    if (r.ok) return { package: r.package }
    const [code, message] = ERR[r.error]; return reply.code(code).send({ error: r.error, message })
  })
}

export function packageAdminRoutes(adm: FastifyInstance, pkg: PackageService) {
  adm.get('/package', async () => ({ ...(await pkg.settings()), default_prompt: DEFAULT_PACKAGE_PROMPT, placeholders: ['{{origin}}', '{{destination}}', '{{budget}}', '{{amount}}', '{{vehicle}}', '{{trip_type}}', '{{days}}', '{{schema}}', '{{sources}}'] }))
  adm.put('/package', async (req, reply) => {
    const b = z.object({ enabled: z.boolean(), prompt: z.string().min(60).max(12000) }).safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'validation', errors: issuesOf(b.error) })
    const errs = validatePackagePrompt(b.data.prompt); if (errs.length) return reply.code(400).send({ error: 'validation', errors: errs })
    await pkg.save(b.data); return pkg.settings()
  })
  adm.post('/package/reset', async () => { await pkg.save({ enabled: (await pkg.settings()).enabled, prompt: DEFAULT_PACKAGE_PROMPT }); return pkg.settings() })
  // آزمایش با ورودی نمونه (حتی وقتی ویژگی برای کاربران خاموش است)
  adm.post('/package/test', { config: { rateLimit: { max: 6, timeWindow: '1 minute' } } }, async (req, reply) => {
    const b = packageInput.safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'validation', errors: issuesOf(b.error) })
    const r = await pkg.generate(b.data, { force: true })
    return r.ok ? { package: r.package } : reply.code(502).send({ error: r.error, errors: r.errors ?? [ERR[r.error][1]] })
  })
}
