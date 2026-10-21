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

const pushSub = z.object({ endpoint: z.string().url().max(1000).refine((u) => u.startsWith('https://'), 'https'), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) })
export function packagePublicRoutes(app: FastifyInstance, pkg: PackageService) {
  app.get('/package/options', async () => ({ budgets: BUDGETS, vehicles: VEHICLES, trip_types: TRIP_TYPES, enabled: (await pkg.settings()).enabled, push_key: await pkg.publicKey() }))
  // طراحی در پس‌زمینهٔ سرور انجام می‌شود: فوراً شناسهٔ کار برمی‌گردد (۲۰۲) و کاربر می‌تواند از برنامه بیرون برود.
  // هر درخواست هزینهٔ AI دارد؛ سقف سخت‌گیرانه برای هر IP
  app.post('/package', { bodyLimit: 4096, config: { rateLimit: { max: 4, timeWindow: '1 minute' } } }, async (req, reply) => {
    const b = packageInput.extend({ push: pushSub.optional() }).safeParse(req.body); if (!b.success) return reply.code(400).send({ error: 'invalid', errors: issuesOf(b.error) })
    const { push, ...input } = b.data
    const r = await pkg.start(input, push)
    if (r.ok) return reply.code(202).send({ job_id: r.id })
    const [code, message] = ERR[r.error === 'busy' ? 'quota' : r.error]; return reply.code(code).send({ error: r.error, message })
  })
  app.get('/package/jobs/:id', async (req, reply) => {
    const id = z.string().uuid().safeParse((req.params as { id: string }).id); if (!id.success) return reply.code(404).send({ error: 'not_found' })
    const j = await pkg.job(id.data); return j ? { job: j } : reply.code(404).send({ error: 'not_found' })
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
