import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { issuesOf } from '../domain/schema.js'
import { FEED_KINDS, FEED_STATUSES, feedContentSchema, sourceInput } from '../feed/schema.js'
import type { FeedService } from '../feed/service.js'
import { createMicroCache, sendCacheable } from '../lib-cache.js'

/** عمومی: کارت امروزِ هر موضوع (فقط منتشرشده‌ها، بدون هیچ فیلد داخلی) */
export function feedPublicRoutes(app: FastifyInstance, feed: FeedService) {
  const cache = createMicroCache()
  // publicFeed هر بار KV را می‌نویسد (چرخش روزانه)؛ ۳۰ ثانیه کش حافظه و ۵ دقیقه کش مرورگر
  app.get('/feed', async (req, reply) => sendCacheable(req, reply, await cache('feed', 30_000, () => feed.publicFeed()), 300))
}

const id = z.coerce.number().int().positive()
const kind = z.enum(FEED_KINDS)
const imageInput = z.object({
  url: z.string().trim().max(2000).refine((u) => /^https:\/\//i.test(u), 'آدرس تصویر باید https باشد.'),
  source_url: z.string().url().max(2000).nullish(), author: z.string().max(200).nullish(),
  license: z.string().trim().min(1, 'مجوز/منبع تصویر الزامی است.').max(120), license_url: z.string().url().max(2000).nullish(), attribution: z.string().max(400).nullish(),
})

/** مدیر: داخل همان پلاگین /admin (احراز هویت و حالت آزمایشی از آن می‌آید) */
export function feedAdminRoutes(adm: FastifyInstance, feed: FeedService) {
  const bad = (reply: FastifyReply, errors: string[], code = 400) => reply.code(code).send({ error: 'validation', errors })
  const pid = (req: FastifyRequest, name = 'id') => id.safeParse((req.params as Record<string, string>)[name])

  adm.get('/feed/topics', async () => ({ topics: await feed.summary() }))

  const listQ = z.object({ kind, status: z.enum(FEED_STATUSES).optional() })
  adm.get('/feed/items', async (req, reply) => {
    const q = listQ.safeParse(req.query); if (!q.success) return bad(reply, issuesOf(q.error))
    return { items: await feed.list(q.data.kind, q.data.status) }
  })

  adm.get('/feed/items/:id', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const it = await feed.get(i.data); return it ? { item: it } : reply.code(404).send({ error: 'not_found' })
  })

  const createBody = z.object({ kind, content: z.unknown(), sources: z.array(sourceInput).max(10).default([]) })
  adm.post('/feed/items', async (req, reply) => {
    const b = createBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    const c = feedContentSchema.safeParse(b.data.content); if (!c.success) return bad(reply, issuesOf(c.error))
    return reply.code(201).send({ item: await feed.create(b.data.kind, c.data, b.data.sources, 'manual') })
  })

  const patchBody = z.object({ content: z.unknown().optional(), sources: z.array(sourceInput).max(10).optional() })
  adm.patch('/feed/items/:id', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const b = patchBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    let content
    if (b.data.content !== undefined) { const c = feedContentSchema.safeParse(b.data.content); if (!c.success) return bad(reply, issuesOf(c.error)); content = c.data }
    const r = await feed.update(i.data, { content, sources: b.data.sources })
    return r.ok ? { item: await feed.get(i.data) } : r.code === 404 ? reply.code(404).send({ error: 'not_found' }) : bad(reply, [r.error], r.code)
  })

  const transBody = z.object({ to: z.enum(FEED_STATUSES), reason: z.string().trim().max(500).optional() })
  adm.post('/feed/items/:id/transition', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const b = transBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    const r = await feed.transition(i.data, b.data.to, b.data.reason)
    return r.ok ? { item: await feed.get(i.data) } : r.code === 404 ? reply.code(404).send({ error: 'not_found' }) : bad(reply, r.errors, r.code)
  })

  adm.delete('/feed/items/:id', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const r = await feed.remove(i.data)
    return r.ok ? reply.code(204).send() : r.code === 404 ? reply.code(404).send({ error: 'not_found' }) : bad(reply, [r.error], r.code)
  })

  // ---------- تصاویر ----------
  adm.post('/feed/items/:id/images/search', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const q = z.object({ query: z.string().trim().max(120).optional() }).safeParse(req.body ?? {})
    const r = await feed.searchImages(i.data, q.success ? q.data.query : undefined, true)
    return r ? { added: r.added, errors: r.errors, item: await feed.get(i.data) } : reply.code(404).send({ error: 'not_found' })
  })
  adm.post('/feed/items/:id/images', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const b = imageInput.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    const item = await feed.addImages(i.data, [{ url: b.data.url, thumb_url: null, provider: 'manual', source_url: b.data.source_url ?? null, author: b.data.author ?? null, license: b.data.license, license_url: b.data.license_url ?? null, attribution: b.data.attribution ?? null }])
    return item ? reply.code(201).send({ item: await feed.get(i.data) }) : reply.code(404).send({ error: 'not_found' })
  })
  adm.post('/feed/items/:id/cover', async (req, reply) => {
    const i = pid(req); if (!i.success) return bad(reply, ['شناسه نامعتبر'])
    const b = z.object({ image_id: z.number().int() }).safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    const r = await feed.setCover(i.data, b.data.image_id)
    return r.ok ? { item: await feed.get(i.data) } : r.code === 404 ? reply.code(404).send({ error: r.error }) : bad(reply, [r.error], r.code)
  })
  adm.delete('/feed/items/:id/images/:imageId', async (req, reply) => {
    const i = pid(req), m = pid(req, 'imageId'); if (!i.success || !m.success) return bad(reply, ['شناسه نامعتبر'])
    const r = await feed.removeImage(i.data, m.data)
    return r.ok ? { item: await feed.get(i.data) } : r.code === 404 ? reply.code(404).send({ error: 'not_found' }) : bad(reply, [r.error], r.code)
  })

  // ---------- تولید با هوش مصنوعی ----------
  const genBody = z.object({ kind, count: z.number().int().min(1).max(5).default(3), hint: z.string().trim().max(120).optional() })
  adm.post('/feed/generate', async (req, reply) => {
    const b = genBody.safeParse(req.body); if (!b.success) return bad(reply, issuesOf(b.error))
    try {
      const r = await feed.generate(b.data.kind, { count: b.data.count, hint: b.data.hint })
      return r.ok ? r : reply.code(422).send({ error: 'validation', errors: r.errors })
    } catch (e) { return reply.code(502).send({ error: 'ai_failed', errors: [(e as Error).message] }) }
  })
}
