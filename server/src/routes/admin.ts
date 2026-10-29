import { timingSafeEqual } from 'node:crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Config } from '../config.js'
import { aiSettingsSchema, loadAiSettings, saveAiSettings } from '../ai/settings.js'
import { validateTemplate, DEFAULT_TEMPLATE } from '../ai/prompt.js'
import { activeTemplate, imageQueriesFor, type AiService } from '../ai/service.js'
import { canTransition, contentSchema, dupKey, issuesOf, STATUSES, type Status } from '../domain/schema.js'
import type { FeedService } from '../feed/service.js'
import type { Ghasedak } from '../auth/ghasedak.js'
import type { AuthService } from '../auth/service.js'
import { smsAdminRoutes } from './authAdmin.js'
import { packageAdminRoutes } from './package.js'
import type { PackageService } from '../package/service.js'
import { usersAdminRoutes } from './usersAdmin.js'
import type { Pusher } from '../package/push.js'
import type { Registry } from '../auth/registry.js'
import { feedAdminRoutes } from './feed.js'
import { SECRET_NAMES, type Secrets } from '../secrets.js'
import type { ImageRow, Store, SuggestionRow } from '../store/types.js'

export type AdminMode = 'token' | 'open_test' | 'disabled'
export const adminMode = (c: Config): AdminMode => (c.ADMIN_TOKEN ? 'token' : c.NODE_ENV !== 'production' || c.ADMIN_OPEN === 'true' ? 'open_test' : 'disabled')

const id = z.coerce.number().int().positive()
const http = (url: string) => /^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(url)
const imageInput = z.object({
  url: z.string().max(1_000_000).refine(http, 'آدرس تصویر باید https یا data:image باشد.'),
  thumb_url: z.string().max(2000).nullish(), provider: z.string().max(40).default('manual'),
  source_url: z.string().url().max(2000).nullish(), author: z.string().max(200).nullish(),
  license: z.string().max(120).nullish(), license_url: z.string().url().max(2000).nullish(), attribution: z.string().max(400).nullish(),
})

export function adminRoutes(app: FastifyInstance, d: { config: Config; store: Store; secrets: Secrets; ai: AiService; feed: FeedService; pkg: PackageService; auth: AuthService; registry: Registry; sms: Ghasedak; pusher: Pusher; now?: () => Date }) {
  const { config, store, secrets, ai } = d, now = () => (d.now ?? (() => new Date()))().toISOString()
  const bad = (reply: FastifyReply, errors: string[], code = 400) => reply.code(code).send({ error: 'validation', errors })
  const mode = adminMode(config)

  // وضعیت دسترسی؛ عمداً بدون احراز هویت تا رابط بتواند وضعیت را توضیح دهد
  app.get('/admin/mode', async () => ({ mode, note: mode === 'open_test' ? 'حالت آزمایشی: دسترسی مدیر بدون احراز هویت است. پیش از انتشار عمومی ADMIN_TOKEN یا احراز هویت واقعی را فعال کنید.' : mode === 'disabled' ? 'در production بدون ADMIN_TOKEN، API مدیر غیرفعال است (برای تست: ADMIN_OPEN=true).' : 'نیاز به توکن مدیر.' }))

  app.register(async (adm) => {
    adm.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
      if (mode === 'disabled') return reply.code(503).send({ error: 'admin_disabled' })
      if (mode === 'token') {
        const h = req.headers.authorization ?? '', got = Buffer.from(h.replace(/^Bearer\s+/i, '')), want = Buffer.from(config.ADMIN_TOKEN!)
        if (got.length !== want.length || !timingSafeEqual(got, want)) return reply.code(401).send({ error: 'unauthorized' })
      }
    })

    // ---------- پیشنهادها ----------
    const listQ = z.object({ status: z.enum(STATUSES).optional(), q: z.string().max(80).optional(), scope: z.enum(['domestic', 'international']).optional(), sort: z.enum(['updated', 'created', 'name']).optional(), order: z.enum(['asc', 'desc']).optional(), limit: z.coerce.number().int().min(1).max(100).default(30), offset: z.coerce.number().int().min(0).default(0) })
    adm.get('/suggestions', async (req, reply) => {
      const p = listQ.safeParse(req.query); if (!p.success) return bad(reply, issuesOf(p.error))
      const r = await store.listSuggestions(p.data)
      const items = await Promise.all(r.items.map(async (s) => ({ ...s, image_counts: countImages(await store.listImages(s.id)) })))
      return { ...r, items }
    })

    const createBody = z.object({ content: z.unknown(), source: z.enum(['manual', 'import']).default('manual') })
    adm.post('/suggestions', { bodyLimit: 256 * 1024 }, async (req, reply) => {
      const b = createBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const c = contentSchema.safeParse(b.data.content); if (!c.success) return bad(reply, issuesOf(c.error))
      const dup = await duplicates(c.data.name, c.data.country)
      const t = now()
      const row = await store.insertSuggestion({ status: 'draft', source: b.data.source, name: c.data.name, country: c.data.country, content: c.data, version: 1, cover_image_id: null, reject_reason: null, ai_meta: null, created_at: t, updated_at: t, published_at: null })
      await store.addVersion({ suggestion_id: row.id, version: 1, content: c.data, note: 'ایجاد', created_at: t })
      return reply.code(201).send({ suggestion: row, duplicates: dup })
    })

    adm.get('/suggestions/:id', async (req, reply) => {
      const sid = id.safeParse((req.params as { id: string }).id); if (!sid.success) return bad(reply, ['شناسه نامعتبر'])
      const s = await store.getSuggestion(sid.data); if (!s) return reply.code(404).send({ error: 'not_found' })
      return { suggestion: s, images: await store.listImages(s.id), versions: await store.listVersions(s.id), duplicates: await duplicates(s.name, s.country, s.id), publish_check: await publishCheck(s) }
    })

    const patchBody = z.object({ content: z.unknown(), expected_version: z.number().int().positive(), note: z.string().max(200).default('') })
    adm.patch('/suggestions/:id', { bodyLimit: 256 * 1024 }, async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      if (s.status === 'archived') return bad(reply, ['پیشنهاد بایگانی‌شده را ابتدا به پیش‌نویس برگردانید.'], 409)
      const b = patchBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      if (b.data.expected_version !== s.version) return reply.code(409).send({ error: 'version_conflict', current_version: s.version })
      const c = contentSchema.safeParse(b.data.content); if (!c.success) return bad(reply, issuesOf(c.error))
      const t = now(), version = s.version + 1
      // ویرایش محتوای منتشرشده، انتشار را لغو می‌کند تا نسخهٔ تازه دوباره دستی تأیید شود
      const unpublished = s.status === 'published'
      const row = await store.updateSuggestion(s.id, { content: c.data, name: c.data.name, country: c.data.country, version, updated_at: t, ...(unpublished ? { status: 'approved' as Status, published_at: null } : {}) })
      await store.addVersion({ suggestion_id: s.id, version, content: c.data, note: b.data.note || 'ویرایش', created_at: t })
      return { suggestion: row, unpublished, duplicates: await duplicates(c.data.name, c.data.country, s.id) }
    })

    const transBody = z.object({ to: z.enum(STATUSES), reason: z.string().trim().max(500).optional() })
    adm.post('/suggestions/:id/transition', async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      const b = transBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const to = b.data.to
      if (!canTransition(s.status, to)) return bad(reply, [`انتقال از «${s.status}» به «${to}» مجاز نیست.`], 409)
      if (to === 'rejected' && !b.data.reason) return bad(reply, ['برای رد کردن، دلیل لازم است.'])
      if (to === 'published') { const pc = await publishCheck(s); if (pc.blocking.length) return bad(reply, pc.blocking, 409) }
      const row = await store.updateSuggestion(s.id, { status: to, updated_at: now(), reject_reason: to === 'rejected' ? b.data.reason! : to === 'draft' || to === 'approved' ? null : s.reject_reason, published_at: to === 'published' ? now() : null })
      return { suggestion: row }
    })

    adm.delete('/suggestions/:id', async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      if (s.status !== 'draft' && s.status !== 'archived' && s.status !== 'rejected') return bad(reply, ['فقط پیش‌نویس، ردشده یا بایگانی‌شده قابل حذف است.'], 409)
      await store.deleteSuggestion(s.id); return reply.code(204).send()
    })

    // ---------- تصاویر ----------
    adm.post('/suggestions/:id/images', { bodyLimit: 1_200_000 }, async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      const b = imageInput.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      if (!b.data.license?.trim()) return bad(reply, ['مجوز/منبع تصویر الزامی است (مثلاً «عکس خودم» یا نام مجوز).'])
      const img = await store.addImage({ suggestion_id: s.id, url: b.data.url, thumb_url: b.data.thumb_url ?? null, provider: b.data.provider, source_url: b.data.source_url ?? null, author: b.data.author ?? null, license: b.data.license.trim(), license_url: b.data.license_url ?? null, attribution: b.data.attribution ?? null, status: 'candidate', created_at: now(), decided_at: null })
      return reply.code(201).send({ image: img })
    })
    adm.post('/suggestions/:id/images/search', async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      const q = z.object({ query: z.string().trim().max(120).optional() }).safeParse(req.body ?? {})
      const r = await ai.searchImageCandidates(q.success && q.data.query ? q.data.query : imageQueriesFor(s.content))
      const stored = await ai.storeCandidates(s.id, r.items)
      return { added: stored.length, errors: r.errors, images: await store.listImages(s.id) }
    })
    const decision = z.object({ status: z.enum(['approved', 'rejected', 'candidate']) })
    adm.post('/images/:id/decision', async (req, reply) => {
      const iid = id.safeParse((req.params as { id: string }).id); if (!iid.success) return bad(reply, ['شناسه نامعتبر'])
      const img = await store.getImage(iid.data); if (!img) return reply.code(404).send({ error: 'not_found' })
      const b = decision.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const s = (await store.getSuggestion(img.suggestion_id))!
      if (b.data.status === 'approved' && !img.license?.trim()) return bad(reply, ['تصویر بدون مجوز مشخص قابل تأیید نیست؛ ابتدا مجوز را ثبت کنید.'], 409)
      if (b.data.status !== 'approved' && s.cover_image_id === img.id && s.status === 'published') return bad(reply, ['این تصویر روی پیشنهاد منتشرشده است؛ ابتدا انتشار را لغو کنید.'], 409)
      const row = await store.updateImage(img.id, { status: b.data.status, decided_at: b.data.status === 'candidate' ? null : now() })
      let cover = s.cover_image_id
      if (b.data.status === 'approved' && !cover) cover = img.id
      if (b.data.status !== 'approved' && cover === img.id) cover = null
      if (cover !== s.cover_image_id) await store.updateSuggestion(s.id, { cover_image_id: cover, updated_at: now() })
      return { image: row, cover_image_id: cover }
    })
    adm.patch('/images/:id', async (req, reply) => {
      const iid = id.safeParse((req.params as { id: string }).id); if (!iid.success) return bad(reply, ['شناسه نامعتبر'])
      const b = imageInput.partial().pick({ source_url: true, author: true, license: true, license_url: true, attribution: true }).safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const img = await store.getImage(iid.data); if (!img) return reply.code(404).send({ error: 'not_found' })
      return { image: await store.updateImage(img.id, Object.fromEntries(Object.entries(b.data).filter(([, v]) => v !== undefined))) }
    })
    adm.post('/suggestions/:id/cover', async (req, reply) => {
      const s = await loadOr404(req, reply); if (!s) return
      const b = z.object({ image_id: z.number().int() }).safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const img = await store.getImage(b.data.image_id)
      if (!img || img.suggestion_id !== s.id || img.status !== 'approved') return bad(reply, ['فقط تصویر تأییدشدهٔ همین پیشنهاد می‌تواند تصویر اصلی باشد.'], 409)
      return { suggestion: await store.updateSuggestion(s.id, { cover_image_id: img.id, updated_at: now() }) }
    })
    adm.delete('/images/:id', async (req, reply) => {
      const iid = id.safeParse((req.params as { id: string }).id); if (!iid.success) return bad(reply, ['شناسه نامعتبر'])
      const img = await store.getImage(iid.data); if (!img) return reply.code(404).send({ error: 'not_found' })
      const s = (await store.getSuggestion(img.suggestion_id))!
      if (s.cover_image_id === img.id) { if (s.status === 'published') return bad(reply, ['تصویر اصلیِ منتشرشده حذف نمی‌شود؛ ابتدا انتشار را لغو کنید.'], 409); await store.updateSuggestion(s.id, { cover_image_id: null }) }
      await store.deleteImage(img.id); return reply.code(204).send()
    })

    // ---------- تنظیمات ارائه‌دهندگان ----------
    adm.get('/settings/ai', async () => ({ settings: await loadAiSettings(store) }))
    adm.put('/settings/ai', async (req, reply) => {
      const b = aiSettingsSchema.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      await saveAiSettings(store, b.data); return { settings: b.data }
    })
    adm.get('/settings/secrets', async () => ({
      secrets: Object.fromEntries(await Promise.all(SECRET_NAMES.map(async (n) => [n, await secrets.status(n)]))),
      // وضعیت راه‌اندازی برای نمایش در صفحه (بدون هیچ مقدار محرمانه)
      setup: { storage: store.kind, encryption_key: !!config.SECRETS_ENCRYPTION_KEY, admin_token: !!config.ADMIN_TOKEN, admin_open: config.ADMIN_OPEN === 'true' || config.NODE_ENV !== 'production' },
    }))
    const secretName = z.enum(SECRET_NAMES)
    adm.put('/settings/secrets/:name', async (req, reply) => {
      const n = secretName.safeParse((req.params as { name: string }).name); if (!n.success) return reply.code(404).send({ error: 'not_found' })
      const b = z.object({ value: z.string().trim().min(8).max(300) }).safeParse(req.body); if (!b.success) return bad(reply, ['کلید معتبر نیست (حداقل ۸ نویسه).'])
      const r = await secrets.set(n.data, b.data.value)
      if (!r.ok) return reply.code(409).send({ error: 'ui_storage_unavailable', reason: r.reason, status: await secrets.status(n.data) })
      return { status: await secrets.status(n.data) }
    })
    adm.delete('/settings/secrets/:name', async (req, reply) => {
      const n = secretName.safeParse((req.params as { name: string }).name); if (!n.success) return reply.code(404).send({ error: 'not_found' })
      await secrets.remove(n.data); return { status: await secrets.status(n.data) }
    })
    adm.post('/settings/test/:provider', async (req, reply) => {
      const p = z.enum(['gemini', 'tavily', 'unsplash', 'wikimedia', 'ghasedak']).safeParse((req.params as { provider: string }).provider); if (!p.success) return reply.code(404).send({ error: 'not_found' })
      if (p.data === 'ghasedak') { // فقط اعتبار حساب را می‌پرسد (پیامکی نمی‌فرستد)
        const t0 = Date.now(), r = await d.sms.credit()
        return r.ok ? { ok: true, message: `کلید معتبر است؛ اعتبار حساب ${Math.round(r.data.credit).toLocaleString('en-US')} ریال.`, latency_ms: Date.now() - t0 } : { ok: false, message: r.message, latency_ms: Date.now() - t0 }
      }
      return ai.testProvider(p.data)
    })

    // ---------- ورود پیامکی (قاصدک) ----------
    smsAdminRoutes(adm, { config, auth: d.auth, sms: d.sms })
    packageAdminRoutes(adm, d.pkg)
    usersAdminRoutes(adm, { registry: d.registry, auth: d.auth, store, pusher: d.pusher, ...(d.now ? { now: () => d.now!().getTime() } : {}) })

    // ---------- قالب پرامپت (نسخه‌دار) ----------
    adm.get('/prompts', async () => ({ items: await store.listPrompts(), builtin: DEFAULT_TEMPLATE, active_version: (await activeTemplate(store)).version }))
    adm.post('/prompts', async (req, reply) => {
      const b = z.object({ text: z.string().min(30).max(8000), note: z.string().max(200).default('') }).safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
      const errs = validateTemplate(b.data.text); if (errs.length) return bad(reply, errs)
      return reply.code(201).send({ prompt: await store.addPrompt({ text: b.data.text, note: b.data.note, created_at: now() }) })
    })
    adm.post('/prompts/:id/activate', async (req, reply) => {
      const pid = id.safeParse((req.params as { id: string }).id); if (!pid.success) return bad(reply, ['شناسه نامعتبر'])
      const p = await store.activatePrompt(pid.data); return p ? { prompt: p } : reply.code(404).send({ error: 'not_found' })
    })
    adm.post('/prompts/reset', async () => { for (const p of await store.listPrompts()) if (p.active) await store.activatePrompt(-1); return { active_version: 0 } })

    // ---------- تولید ----------
    const genBody = z.object({ names: z.array(z.string().trim().min(1).max(80)).min(1).max(5) })
    adm.post('/ai/generate', async (req, reply) => {
      const b = genBody.safeParse(req.body); if (!b.success) return bad(reply, ['۱ تا ۵ نام مقصد لازم است.'])
      const results = []
      // دو مقصد هم‌زمان (سریع‌تر از پشت‌سرهم، بدون فشار زیاد روی سهمیهٔ Gemini)؛ ترتیب نتایج حفظ می‌شود
      const names = [...new Set(b.data.names)], out: Awaited<ReturnType<typeof generateOne>>[] = new Array(names.length)
      let next = 0
      await Promise.all(Array.from({ length: Math.min(2, names.length) }, async () => { while (next < names.length) { const i = next++; out[i] = await generateOne(names[i], true) } }))
      return { results: out }
    })
    adm.post('/ai/test-generation', async (req, reply) => {
      const b = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(req.body); if (!b.success) return bad(reply, ['نام مقصد لازم است.'])
      return generateOne(b.data.name, false)
    })

    async function generateOne(name: string, save: boolean) {
      let g
      try { g = await ai.generateContent(name) } catch (e) { return { name, ok: false, errors: [(e as Error).message], saved: false } }
      if (!g.ok) return { name, ok: false, errors: g.errors, saved: false, meta: g.meta }
      if (!save) return { name, ok: true, saved: false, content: g.content, meta: g.meta }
      const t = now(), dup = await duplicates(g.content.name, g.content.country)
      const row = await store.insertSuggestion({ status: 'draft', source: 'ai', name: g.content.name, country: g.content.country, content: g.content, version: 1, cover_image_id: null, reject_reason: null, ai_meta: g.meta, created_at: t, updated_at: t, published_at: null })
      await store.addVersion({ suggestion_id: row.id, version: 1, content: g.content, note: `تولید با ${g.meta.model}`, created_at: t })
      let image_errors: string[] = [], added = 0
      const s = await loadAiSettings(store)
      if (s.tasks.images.autoSearchOnGenerate) { const r = await ai.searchImageCandidates(imageQueriesFor(g.content)); added = (await ai.storeCandidates(row.id, r.items)).length; image_errors = r.errors }
      return { name, ok: true, saved: true, id: row.id, duplicates: dup, images_added: added, image_errors, meta: g.meta }
    }

    // ---------- محتوای صفحهٔ اصلی (آیا می‌دانستید + موضوعات صفحهٔ دوم) ----------
    feedAdminRoutes(adm, d.feed)

    // ---------- کمکی‌ها ----------
    async function loadOr404(req: FastifyRequest, reply: FastifyReply): Promise<SuggestionRow | null> {
      const sid = id.safeParse((req.params as { id: string }).id)
      if (!sid.success) { bad(reply, ['شناسه نامعتبر']); return null }
      const s = await store.getSuggestion(sid.data)
      if (!s) { reply.code(404).send({ error: 'not_found' }); return null }
      return s
    }
    async function duplicates(name: string, country: string, exceptId?: number) {
      const k = dupKey(name, country)
      return (await store.allSuggestions()).filter((x) => x.id !== exceptId && x.status !== 'archived' && dupKey(x.name, x.country) === k).map((x) => ({ id: x.id, status: x.status, name: x.name }))
    }
    async function publishCheck(s: SuggestionRow) {
      const blocking: string[] = [], warnings: string[] = []
      const cover = s.cover_image_id ? await store.getImage(s.cover_image_id) : null
      if (!cover || cover.status !== 'approved') blocking.push('تصویر اصلی تأییدشده‌ای انتخاب نشده است.')
      else if (!cover.license) blocking.push('تصویر اصلی مجوز مشخص ندارد.')
      const live = (await duplicates(s.name, s.country, s.id)).find((x) => x.status === 'published')
      if (live) blocking.push(`پیشنهاد منتشرشده‌ای با همین نام و کشور وجود دارد (#${live.id}).`)
      if (s.content.latitude === undefined) warnings.push('بدون مختصات: آمار واقعی آب‌وهوای ۵ ساله اعمال نمی‌شود.')
      if (s.content.attractions.length === 0) warnings.push('جاذبه‌ای ثبت نشده است.')
      if (s.ai_meta && s.ai_meta.sources.length === 0) warnings.push('این متن بدون منبع وب تولید شده؛ صحت اطلاعات را دستی بررسی کنید.')
      return { blocking, warnings }
    }
    const countImages = (l: ImageRow[]) => ({ candidate: l.filter((i) => i.status === 'candidate').length, approved: l.filter((i) => i.status === 'approved').length, rejected: l.filter((i) => i.status === 'rejected').length })
  }, { prefix: '/admin' })
}
