import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Registry, Person } from '../auth/registry.js'
import type { AuthService } from '../auth/service.js'
import { createMicroCache } from '../lib-cache.js'
import { consentOf, profileOf, statsOf, type UserProfile } from '../analytics/profile.js'
import type { EventRow, Store } from '../store/types.js'

const DAY = 86_400_000
const maskPhone = (p?: string) => (p && p.length >= 8 ? `${p.slice(0, 4)}***${p.slice(-3)}` : undefined)
const norm = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim().toLowerCase()
const nameOf = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(' ') || undefined

const summary = (p: Person, prof?: UserProfile) => ({
  id: p.id, status: p.status, state: p.state, display_name: nameOf(p), city: p.city,
  first_seen_at: p.first_seen_at, last_active_at: p.last_seen_at,
  sessions: p.sessions ?? 0, destinations_viewed: prof?.destinations_viewed ?? 0, top_interests: prof?.top_interests ?? [], event_count: prof?.event_count ?? 0,
  profile_complete: p.profile_complete, phone_masked: maskPhone(p.phone), registered_at: p.registered_at,
})
const PROFILE_EVENTS = 5000 // سقف رویدادهای تازه‌ای که برای محاسبهٔ پروفایل یک کاربر خوانده می‌شود
const STATS_EVENTS = 50_000 // سقف رویدادهای ۳۰ روز اخیر برای آمار داشبورد (بیشتر از این باید در SQL تجمیع شود)
const DAY_MS = 86_400_000

const listQuery = z.object({
  filters: z.object({ query: z.string().max(80).optional(), status: z.enum(['guest', 'registered']).optional(), city: z.string().max(60).optional() }).passthrough().default({}),
  sort: z.string().max(30).optional(), dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).passthrough()

/** پنل «کاربران»: داده از ثبت نصب‌ها و حساب‌ها (مهمان ← ثبت‌نام‌شده ← پروفایل کامل) به‌علاوهٔ رویدادهای رفتاری و رضایت‌های ذخیره‌شده (/api/events) که با شناسه‌های نصبِ هر کاربر به او وصل می‌شوند.
 *  رویداد فقط برای نصب‌هایی هست که رضایت تحلیل داده‌اند؛ بقیه صفر نشان داده می‌شوند. */
export function usersAdminRoutes(adm: FastifyInstance, d: { registry: Registry; auth: AuthService; store: Store; now?: () => number }) {
  const { registry, auth, store } = d
  const nowMs = d.now ?? (() => Date.now())
  const cached = createMicroCache(nowMs)
  const eventsOfPerson = (p: Person) => store.eventsOf(p.anonymous_ids, { limit: PROFILE_EVENTS })
  const profileFor = async (p: Person) => profileOf((await eventsOfPerson(p)).items, new Date(nowMs()))
  const confirmBody = z.object({ confirm: z.string().max(120) })

  adm.get('/users/stats', async () => {
    const all = await registry.all(), t = nowMs()
    const ev = await cached('user-stats-events', 30_000, async () => {
      const rows = await store.eventsSince(new Date(nowMs() - 30 * DAY_MS).toISOString(), STATS_EVENTS)
      const owner = new Map<string, string>(); for (const p of await registry.all()) for (const a of p.anonymous_ids) owner.set(a, p.id)
      return statsOf(rows, new Date(nowMs()), (a) => owner.get(a) ?? a)
    })
    const within = (days: number) => all.filter((p) => t - Date.parse(p.last_seen_at) <= days * DAY).length
    const registered = all.filter((p) => p.status === 'registered')
    return {
      total: all.length, guests: all.length - registered.length, registered: registered.length,
      complete: registered.filter((p) => p.profile_complete).length, incomplete: registered.filter((p) => !p.profile_complete).length,
      dau: within(1), wau: within(7), mau: within(30),
      newProfiles: all.filter((p) => t - Date.parse(p.first_seen_at) <= 30 * DAY).length,
      returning: all.filter((p) => t - Date.parse(p.last_seen_at) <= 7 * DAY && t - Date.parse(p.first_seen_at) > 7 * DAY).length,
      sessions: all.reduce((n, p) => n + (p.sessions ?? 0), 0), topDestinations: ev.topDestinations, topSeasons: ev.topSeasons, topCategories: ev.topCategories, favorites: ev.favorites, searches: ev.searches, offerClicks: ev.offerClicks, notificationOpens: ev.notificationOpens,
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
    const slice = rows.slice((page - 1) * pageSize, page * pageSize)
    const profs = await Promise.all(slice.map((p) => profileFor(p)))
    return { items: slice.map((p, i) => summary(p, profs[i])), total: rows.length, page, pageSize }
  })

  adm.get('/users/:id', async (req, reply) => {
    const p = await registry.get((req.params as { id: string }).id); if (!p) return reply.code(404).send({ error: 'not_found' })
    const contact = (req.query as { contact?: string }).contact === '1'
    const [prof, consents] = await Promise.all([profileFor(p), store.consentsOf(p.anonymous_ids)])
    const { interests, favorites, seasons, viewed_destinations, viewed_tours, filters_used, offer_clicks, searches, notification_opens, event_types } = prof
    return {
      ...summary(p, prof), country: undefined, province: undefined, anonymous_ids: p.anonymous_ids,
      favorites, interests, seasons, viewed_destinations, viewed_tours, filters_used, offer_clicks, searches, notification_opens, event_types, last_event_at: prof.last_event_at,
      consent: consentOf(consents), consent_log: consents.slice(-20).reverse().map((c) => ({ kind: c.kind, granted: c.granted, at: c.recorded_at, source: c.source, policy_version: c.policy_version })),
      notifications: {}, merge_logs: [],
      platform: p.platform, app_version: p.app_version, opens: p.opens ?? 0, first_name: p.first_name, last_name: p.last_name, log: [...(p.log ?? [])].reverse(),
      ...(contact ? { contact: { phone: p.phone, email: p.email } } : {}), // شماره و ایمیل فقط با contact=1 (ایمیل دیگر در پاسخ عادی نیست)
    }
  })

  adm.get('/users/:id/events', async (req, reply) => {
    const p = await registry.get((req.params as { id: string }).id); if (!p) return reply.code(404).send({ error: 'not_found' })
    const q = req.query as { page?: string; pageSize?: string }
    const page = Math.max(1, Math.floor(Number(q.page)) || 1), pageSize = Math.min(100, Math.max(1, Math.floor(Number(q.pageSize)) || 20))
    const r = await store.eventsOf(p.anonymous_ids, { limit: pageSize, offset: (page - 1) * pageSize })
    const toApi = (e: EventRow) => ({ event_id: e.event_id, event_type: e.event_type, occurred_at: e.occurred_at, session_id: e.session_id, app_version: e.app_version, platform: e.platform, ...e.props })
    return { items: r.items.map(toApi), total: r.total, page, pageSize }
  })

  // پیش‌نمایش مخاطب: فقط شمارش. واجد شرایط = حساب فعال با رضایت تبلیغاتی ثبت‌شده و ارسال‌نشده در ۷ روز اخیر؛ اگر رضایتی به سرور نرسیده باشد «بدون رضایت» حساب می‌شود.
  adm.post('/audience/preview', async (req) => {
    const f = z.object({ status: z.enum(['guest', 'registered']).optional(), city: z.string().max(60).optional() }).passthrough().safeParse(req.body ?? {})
    const filters = f.success ? f.data : {}
    let rows = await registry.all()
    if (filters.status) rows = rows.filter((p) => p.status === filters.status)
    if (filters.city) rows = rows.filter((p) => p.city && norm(p.city).includes(norm(filters.city!)))
    const res = { matched: rows.length, eligible: 0, excluded: { noMarketingConsent: 0, unsubscribed: 0, frequencyCap: 0, inactiveAccount: 0 } }
    const cons = await Promise.all(rows.map(async (p) => consentOf(await store.consentsOf(p.anonymous_ids)).marketing))
    rows.forEach((p, i) => { if (p.state !== 'active') res.excluded.inactiveAccount++; else if (cons[i] !== true) res.excluded.noMarketingConsent++; else res.eligible++ })
    return res
  })

  adm.post('/users/:id/disable', async (req, reply) => {
    const id = (req.params as { id: string }).id, b = confirmBody.safeParse(req.body)
    if (!b.success || b.data.confirm !== id) return reply.code(400).send({ error: 'validation', errors: ['تأیید با شناسه مطابقت ندارد.'] })
    return (await registry.setState(id, 'disabled')) ? { ok: true } : reply.code(404).send({ error: 'not_found' })
  })
  adm.delete('/users/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id, b = confirmBody.safeParse(req.body)
    if (!b.success || b.data.confirm !== id) return reply.code(400).send({ error: 'validation', errors: ['تأیید با شناسه مطابقت ندارد.'] })
    const p = await registry.get(id); if (!p) return reply.code(404).send({ error: 'not_found' })
    const anonIds = [...p.anonymous_ids]
    if (p.user_id) await auth.deleteAccountById(p.user_id); else await registry.remove(id)
    const purged = await store.deleteSubjects(anonIds) // رویدادها و رضایت‌های این کاربر هم حذف می‌شود
    return { ok: true, deleted_events: purged.events, deleted_consents: purged.consents }
  })
}
