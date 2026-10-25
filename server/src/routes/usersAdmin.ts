import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Registry, Person } from '../auth/registry.js'
import type { AuthService } from '../auth/service.js'

const DAY = 86_400_000
const maskPhone = (p?: string) => (p && p.length >= 8 ? `${p.slice(0, 4)}***${p.slice(-3)}` : undefined)
const norm = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()
const nameOf = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined

const summary = (p: Person) => ({
  id: p.id, status: p.status, state: p.state, display_name: nameOf(p), city: p.city,
  first_seen_at: p.first_seen_at, last_active_at: p.last_seen_at,
  sessions: p.sessions ?? 0, destinations_viewed: 0, top_interests: [] as string[], event_count: 0,
  profile_complete: p.profile_complete, phone_masked: maskPhone(p.phone), registered_at: p.registered_at,
})

const listQuery = z.object({
  filters: z.object({ query: z.string().max(80).optional(), status: z.enum(['guest', 'registered']).optional(), city: z.string().max(60).optional() }).passthrough().default({}),
  sort: z.string().max(30).optional(), dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).passthrough()

/** پنل «کاربران»: داده از ثبت نصب‌ها و حساب‌ها (مهمان ← ثبت‌نام‌شده ← پروفایل کامل). رویدادهای رفتاری هنوز ذخیره نمی‌شوند؛ شمارندهٔ آن‌ها صفر است. */
export function usersAdminRoutes(adm: FastifyInstance, d: { registry: Registry; auth: AuthService }) {
  const { registry, auth } = d
  const confirmBody = z.object({ confirm: z.string().max(120) })

  adm.get('/users/stats', async () => {
    const all = await registry.all(), t = Date.now()
    const within = (days: number) => all.filter((p) => t - Date.parse(p.last_seen_at) <= days * DAY).length
    const registered = all.filter((p) => p.status === 'registered')
    return {
      total: all.length, guests: all.length - registered.length, registered: registered.length,
      complete: registered.filter((p) => p.profile_complete).length, incomplete: registered.filter((p) => !p.profile_complete).length,
      dau: within(1), wau: within(7), mau: within(30),
      newProfiles: all.filter((p) => t - Date.parse(p.first_seen_at) <= 30 * DAY).length,
      returning: all.filter((p) => t - Date.parse(p.last_seen_at) <= 7 * DAY && t - Date.parse(p.first_seen_at) > 7 * DAY).length,
      sessions: all.reduce((n, p) => n + (p.sessions ?? 0), 0), topDestinations: [], topSeasons: [], topCategories: [], favorites: 0, searches: 0, offerClicks: 0, notificationOpens: 0,
      definitions: { active: 'کاربر فعال: آخرین مراجعه در بازه (۱، ۷ یا ۳۰ روز).', complete: 'پروفایل کامل: نام، نام خانوادگی و شهر ثبت شده باشد.' },
    }
  })

  adm.get('/users', async (req, reply) => {
    let raw: unknown = {}
    try { raw = JSON.parse(String((req.query as { q?: string }).q ?? '{}')) } catch { return reply.code(400).send({ error: 'validation', errors: ['پرس‌وجو نامعتبر است.'] }) }
    const q = listQuery.safeParse(raw); if (!q.success) return reply.code(400).send({ error: 'validation', errors: ['پرس‌وجو نامعتبر است.'] })
    const f = q.data.filters
    let rows = await registry.all() // کپی است؛ مرتب‌سازی روی فهرست اصلی اثر ندارد
    if (f.status) rows = rows.filter((p) => p.status === f.status)
    if (f.city) rows = rows.filter((p) => p.city && norm(p.city).includes(norm(f.city!)))
    if (f.query) { const k = norm(f.query); rows = rows.filter((p) => norm(p.id).includes(k) || norm(nameOf(p) ?? '').includes(k) || (p.phone ?? '').includes(f.query!)) }
    const dir = q.data.dir === 'asc' ? 1 : -1
    rows.sort((a, b) => (a.last_seen_at < b.last_seen_at ? -1 : 1) * dir)
    const { page, pageSize } = q.data
    return { items: rows.slice((page - 1) * pageSize, page * pageSize).map(summary), total: rows.length, page, pageSize }
  })

  adm.get('/users/:id', async (req, reply) => {
    const p = await registry.get((req.params as { id: string }).id); if (!p) return reply.code(404).send({ error: 'not_found' })
    const contact = (req.query as { contact?: string }).contact === '1'
    return {
      ...summary(p), country: undefined, province: undefined, anonymous_ids: p.anonymous_ids,
      favorites: { destination: [], tour: [] }, interests: [], consent: { analytics: false, personalization: false, marketing: false }, notifications: {},
      merge_logs: [], seasons: {}, viewed_destinations: [], viewed_tours: [], filters_used: {}, offer_clicks: 0,
      platform: p.platform, app_version: p.app_version, opens: p.opens ?? 0, first_name: p.first_name, last_name: p.last_name, email: p.email, log: [...(p.log ?? [])].reverse(),
      ...(contact ? { contact: { phone: p.phone, email: p.email } } : {}),
    }
  })

  adm.get('/users/:id/events', async (req) => { const { page, pageSize } = req.query as { page?: string; pageSize?: string }; return { items: [], total: 0, page: Number(page) || 1, pageSize: Number(pageSize) || 20 } })
  adm.post('/audience/preview', async () => ({ matched: 0, eligible: 0, excluded: { noMarketingConsent: 0, unsubscribed: 0, frequencyCap: 0, inactiveAccount: 0 } }))

  adm.post('/users/:id/disable', async (req, reply) => {
    const id = (req.params as { id: string }).id, b = confirmBody.safeParse(req.body)
    if (!b.success || b.data.confirm !== id) return reply.code(400).send({ error: 'validation', errors: ['تأیید با شناسه مطابقت ندارد.'] })
    return (await registry.setState(id, 'disabled')) ? { ok: true } : reply.code(404).send({ error: 'not_found' })
  })
  adm.delete('/users/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id, b = confirmBody.safeParse(req.body)
    if (!b.success || b.data.confirm !== id) return reply.code(400).send({ error: 'validation', errors: ['تأیید با شناسه مطابقت ندارد.'] })
    const p = await registry.get(id); if (!p) return reply.code(404).send({ error: 'not_found' })
    if (p.user_id) await auth.deleteAccountById(p.user_id); else await registry.remove(id)
    return { ok: true }
  })
}
