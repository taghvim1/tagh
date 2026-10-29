import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Registry, Person } from '../auth/registry.js'
import type { AuthService } from '../auth/service.js'
import { createMicroCache } from '../lib-cache.js'
import { filtersSchema, matchesRow, nameOf, reachOf, sortValue, SORT_KEYS, FREQUENCY_CAP_DAYS, STALE_DEFAULT_DAYS, type Reach, type Row } from '../analytics/audience.js'
import { consentOf, profileOf, statsOf, type ConsentKind, type UserProfile } from '../analytics/profile.js'
import type { Pusher } from '../package/push.js'
import type { ConsentRow, EventRow, Store } from '../store/types.js'

const DAY = 86_400_000
const maskPhone = (p?: string) => (p && p.length >= 8 ? `${p.slice(0, 4)}***${p.slice(-3)}` : undefined)
const PROFILE_EVENTS = 5000 // سقف رویدادهای تازهٔ یک کاربر برای صفحهٔ جزئیات
const SNAP_DAYS = 180, SNAP_EVENTS = 100_000, SNAP_CONSENTS = 300_000 // نمای کلی (فهرست/فیلتر/آمار): رویدادهای ۱۸۰ روز اخیر؛ بیشتر از این باید در SQL تجمیع شود
const MAX_SEND = 5000 // سقف گیرندگان در یک ارسال
const LOG_KEY = 'promo:log', LOG_MAX = 30
const INTEREST_DIMS = ['type', 'season', 'budget', 'style', 'scope'] as const

const summary = (r: Row) => ({
  id: r.p.id, status: r.p.status, state: r.p.state, display_name: nameOf(r.p), city: r.p.city,
  first_seen_at: r.p.first_seen_at, last_active_at: r.p.last_seen_at,
  sessions: r.p.sessions ?? 0, destinations_viewed: r.prof.destinations_viewed, top_interests: r.prof.top_interests, event_count: r.prof.event_count,
  profile_complete: r.p.profile_complete, phone_masked: maskPhone(r.p.phone), registered_at: r.p.registered_at,
  consent_marketing: r.consent.marketing, has_push: !!r.p.push, platform: r.p.platform,
})

const listQuery = z.object({
  filters: filtersSchema.default({}), sort: z.enum(SORT_KEYS as [string, ...string[]]).optional(), dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).passthrough()
const sendBody = z.object({
  title: z.string().trim().min(1).max(60), body: z.string().trim().min(1).max(200),
  url: z.string().trim().max(200).regex(/^\/(?!\/)[^\s]*$/, 'آدرس باید مسیر داخلی برنامه باشد (مثل /tours)').default('/'),
  filters: filtersSchema.default({}), confirm: z.literal(true),
})
/** پارامتر from=push تا باز شدن از روی اعلان در تحلیل «بازکردن اعلان» شمرده شود */
const withFrom = (u: string) => (u.includes('from=') ? u : u + (u.includes('?') ? '&' : '?') + 'from=push')

/** پنل «کاربران»: نصب‌ها/حساب‌ها (مهمان ← ثبت‌نام‌شده ← پروفایل کامل) + رویدادهای رفتاری و رضایت‌های ذخیره‌شده که با شناسه‌های نصبِ هر کاربر به او وصل می‌شوند.
 *  رویداد فقط برای نصب‌هایی هست که رضایت تحلیل داده‌اند. ارسال تبلیغاتی فقط به کسانی می‌رود که رضایت تبلیغاتی + اشتراک Push دارند. */
export function usersAdminRoutes(adm: FastifyInstance, d: { registry: Registry; auth: AuthService; store: Store; pusher: Pusher; now?: () => number }) {
  const { registry, auth, store, pusher } = d
  const nowMs = d.now ?? (() => Date.now())
  const cached = createMicroCache(nowMs)
  const confirmBody = z.object({ confirm: z.string().max(120) })

  async function build() {
    const now = new Date(nowMs()), people = await registry.all()
    const owner = new Map<string, string>()
    for (const p of people) for (const a of p.anonymous_ids) owner.set(a, p.id)
    const [events, consents] = await Promise.all([store.eventsSince(new Date(nowMs() - SNAP_DAYS * DAY).toISOString(), SNAP_EVENTS), store.allConsents(SNAP_CONSENTS)])
    const evBy = new Map<string, EventRow[]>(), conBy = new Map<string, ConsentRow[]>(), unlinked = new Set<string>()
    for (const e of events) { const o = owner.get(e.anonymous_id); if (!o) { unlinked.add(e.anonymous_id); continue } const l = evBy.get(o); l ? l.push(e) : evBy.set(o, [e]) }
    for (const c of consents) { const o = owner.get(c.subject_id); if (!o) continue; const l = conBy.get(o); l ? l.push(c) : conBy.set(o, [c]) }
    const rows: Row[] = people.map((p) => ({ p, prof: profileOf(evBy.get(p.id) ?? [], now), consent: consentOf(conBy.get(p.id) ?? []) }))
    return { rows, events, owner, unlinked: unlinked.size }
  }
  const snapshot = () => cached('users-snapshot', 20_000, build)

  const summarizeReach = (rows: Row[]) => {
    const t = nowMs(), res = { matched: rows.length, eligible: 0, excluded: { noMarketingConsent: 0, unsubscribed: 0, frequencyCap: 0, inactiveAccount: 0, noPushSubscription: 0 } }
    for (const r of rows) { const k: Reach = reachOf(r, t); if (k === 'eligible') res.eligible++; else res.excluded[k]++ }
    return res
  }

  adm.get('/users/stats', async () => {
    const snap = await snapshot(), all = snap.rows, t = nowMs(), now = new Date(t)
    const ev = statsOf(snap.events, now, (a) => snap.owner.get(a) ?? a)
    const within = (days: number) => all.filter((r) => t - Date.parse(r.p.last_seen_at) <= days * DAY).length
    const registered = all.filter((r) => r.p.status === 'registered')
    // علایق مخاطبان: چند نفر به هر فصل/نوع مقصد/بودجه/سبک/داخلی-خارجی علاقه دارند (امتیاز علاقهٔ قوی)
    const count = new Map<string, number>()
    for (const r of all) for (const k of r.prof.strong_interests) count.set(k, (count.get(k) ?? 0) + 1)
    const interests = INTEREST_DIMS.flatMap((dim) => [...count].filter(([k]) => k.startsWith(dim + ':')).map(([k, people]) => ({ dimension: dim, value: k.slice(dim.length + 1), people })).sort((a, b) => b.people - a.people).slice(0, 6))
    const events24 = snap.events.filter((e) => t - Date.parse(e.occurred_at) <= DAY).length
    return {
      total: all.length, guests: all.length - registered.length, registered: registered.length,
      complete: registered.filter((r) => r.p.profile_complete).length, incomplete: registered.filter((r) => !r.p.profile_complete).length,
      dau: within(1), wau: within(7), mau: within(30),
      newProfiles: all.filter((r) => t - Date.parse(r.p.first_seen_at) <= 30 * DAY).length,
      returning: all.filter((r) => t - Date.parse(r.p.last_seen_at) <= 7 * DAY && t - Date.parse(r.p.first_seen_at) > 7 * DAY).length,
      sessions: all.reduce((n, r) => n + (r.p.sessions ?? 0), 0), topDestinations: ev.topDestinations, topSeasons: ev.topSeasons, topCategories: ev.topCategories, favorites: ev.favorites, searches: ev.searches, offerClicks: ev.offerClicks, notificationOpens: ev.notificationOpens,
      interests,
      diagnostics: {
        events_total: (await store.eventStats()).events, events_24h: events24, people_with_events: all.filter((r) => r.prof.event_count > 0).length,
        unlinked_analytics_ids: snap.unlinked, analytics_granted: all.filter((r) => r.consent.analytics === true).length, marketing_granted: all.filter((r) => r.consent.marketing === true).length,
        notifications_granted: all.filter((r) => r.consent.notifications === true).length, location_granted: all.filter((r) => r.consent.location === true).length,
        push_subscribers: all.filter((r) => r.p.push).length, guests_never_returned: all.filter((r) => r.p.status === 'guest' && (r.p.opens ?? 1) <= 1).length,
      },
      definitions: { active: 'کاربر فعال: آخرین مراجعه در بازه (۱، ۷ یا ۳۰ روز).', complete: 'پروفایل کامل: نام، نام خانوادگی و شهر ثبت شده باشد.', interests: 'علایق: تعداد کاربرانی که امتیاز علاقهٔ قوی (≥۳) به آن مورد دارند؛ از رویدادهای ۱۸۰ روز اخیرِ کسانی که رضایت تحلیل داده‌اند.' },
    }
  })

  adm.get('/users', async (req, reply) => {
    let raw: unknown = {}
    try { raw = JSON.parse(String((req.query as { q?: string }).q ?? '{}')) } catch { return reply.code(400).send({ error: 'validation', errors: ['پرس‌وجو نامعتبر است.'] }) }
    const q = listQuery.safeParse(raw); if (!q.success) return reply.code(400).send({ error: 'validation', errors: ['پرس‌وجو نامعتبر است.'] })
    const t = nowMs(), key = (q.data.sort ?? 'last_active_at') as (typeof SORT_KEYS)[number], sign = q.data.dir === 'asc' ? 1 : -1
    const rows = (await snapshot()).rows.filter((r) => matchesRow(r, q.data.filters, t))
    rows.sort((a, b) => { const x = sortValue(a, key), y = sortValue(b, key); return ((typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y))) * sign) || a.p.id.localeCompare(b.p.id) })
    const { page, pageSize } = q.data
    return { items: rows.slice((page - 1) * pageSize, page * pageSize).map(summary), total: rows.length, page, pageSize }
  })

  // مهمان‌های بی‌فعالیت (یک‌بار-بازشده و برنگشته): شمارش و پاک‌سازی. ثبت‌های ربات/آزمایشی را می‌شود با این دکمه پاک کرد.
  adm.get('/users/stale-count', async (req) => {
    const days = Math.min(365, Math.max(1, Math.floor(Number((req.query as { days?: string }).days)) || STALE_DEFAULT_DAYS))
    const cut = nowMs() - days * DAY
    return { days, count: (await registry.all()).filter((p) => p.status === 'guest' && !p.user_id && (p.opens ?? 1) <= 1 && Date.parse(p.last_seen_at) < cut).length }
  })
  adm.post('/users/cleanup', async (req, reply) => {
    const b = z.object({ olderThanDays: z.number().int().min(1).max(365).default(STALE_DEFAULT_DAYS), confirm: z.literal(true) }).safeParse(req.body)
    if (!b.success) return reply.code(400).send({ error: 'validation', errors: ['تأیید لازم است.'] })
    const gone = await registry.purgeStaleGuests(b.data.olderThanDays)
    const purged = await store.deleteSubjects(gone.flatMap((p) => p.anonymous_ids))
    return { removed: gone.length, deleted_events: purged.events, deleted_consents: purged.consents }
  })

  adm.get('/users/:id', async (req, reply) => {
    const p = await registry.get((req.params as { id: string }).id); if (!p) return reply.code(404).send({ error: 'not_found' })
    const contact = (req.query as { contact?: string }).contact === '1'
    const [evs, consents] = await Promise.all([store.eventsOf(p.anonymous_ids, { limit: PROFILE_EVENTS }), store.consentsOf(p.anonymous_ids)])
    const prof: UserProfile = profileOf(evs.items, new Date(nowMs()))
    const consent = consentOf(consents)
    const { viewed_destination_ids: _v, strong_interests: _s, ...pub } = prof
    void _v; void _s
    return {
      ...summary({ p, prof, consent }), anonymous_ids: p.anonymous_ids, ...pub, consent,
      consent_log: consents.slice(-20).reverse().map((c) => ({ kind: c.kind, granted: c.granted, at: c.recorded_at, source: c.source, policy_version: c.policy_version })),
      notifications: {}, merge_logs: [],
      push: { subscribed: !!p.push, at: p.push?.at, last_promo_sent_at: p.promo_last_sent_at, unsubscribed_at: p.promo_unsubscribed_at },
      reach: reachOf({ p, prof, consent }, nowMs()),
      app_version: p.app_version, opens: p.opens ?? 0, first_name: p.first_name, last_name: p.last_name, log: [...(p.log ?? [])].reverse(),
      ...(contact ? { contact: { phone: p.phone, email: p.email } } : {}), // شماره و ایمیل فقط با contact=1
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

  // اعلان آزمایشی به یک کاربر مشخص (برای تست مسیر کامل Push، بدون در نظر گرفتن رضایت تبلیغاتی و سقف تکرار؛ فقط اشتراک لازم است)
  adm.post('/users/:id/push-test', async (req, reply) => {
    const p = await registry.get((req.params as { id: string }).id); if (!p) return reply.code(404).send({ error: 'not_found' })
    if (!p.push) return reply.code(409).send({ error: 'no_push', errors: ['این کاربر اشتراک اعلان ندارد (اجازهٔ اعلان یا رضایت تبلیغاتی نداده است).'] })
    const b = z.object({ title: z.string().trim().min(1).max(60).default('تقویم سفر'), body: z.string().trim().min(1).max(200).default('این یک اعلان آزمایشی است.') }).safeParse(req.body ?? {})
    if (!b.success) return reply.code(400).send({ error: 'validation', errors: ['متن نامعتبر است.'] })
    const r = await pusher.deliver({ endpoint: p.push.endpoint, keys: { p256dh: p.push.p256dh, auth: p.push.auth } }, { title: b.data.title, body: b.data.body, url: '/', tag: 'taghvim-test' })
    if (r === 'gone') await registry.clearPushByEndpoint(p.push.endpoint)
    return { result: r }
  })

  // ---------- مخاطب هدفمند ----------
  // پیش‌نمایش: فقط شمارش. واجد شرایط = حساب فعال + رضایت تبلیغاتی ثبت‌شده + اشتراک Push + ارسال‌نشده در ۷ روز اخیر.
  adm.post('/audience/preview', async (req, reply) => {
    const f = filtersSchema.safeParse(req.body ?? {}); if (!f.success) return reply.code(400).send({ error: 'validation', errors: ['فیلتر نامعتبر است.'] })
    const t = nowMs(), rows = (await snapshot()).rows.filter((r) => matchesRow(r, { ...f.data, marketingConsent: undefined }, t))
    return { ...summarizeReach(rows), frequency_cap_days: FREQUENCY_CAP_DAYS }
  })

  adm.post('/audience/send', { bodyLimit: 16 * 1024 }, async (req, reply) => {
    const b = sendBody.safeParse(req.body)
    if (!b.success) return reply.code(400).send({ error: 'validation', errors: b.error.issues.slice(0, 3).map((i) => i.message === 'Invalid literal value, expected true' ? 'تأیید ارسال لازم است.' : i.message) })
    const t = nowMs(), snap = await build() // آخرین وضعیت (بدون کش) تا کسی که همین حالا رضایت را لغو کرده حذف شود
    const matched = snap.rows.filter((r) => matchesRow(r, { ...b.data.filters, marketingConsent: undefined }, t))
    const targets = matched.filter((r) => reachOf(r, t) === 'eligible' && r.p.push)
    if (targets.length > MAX_SEND) return reply.code(400).send({ error: 'too_many', errors: [`تعداد گیرندگان (${targets.length}) از سقف ${MAX_SEND} بیشتر است؛ فیلتر را محدودتر کنید.`] })
    const payload = { title: b.data.title, body: b.data.body, url: withFrom(b.data.url), tag: 'taghvim-promo' }
    let sent = 0, failed = 0, removed = 0
    const sentIds: string[] = [], queue = [...targets]
    await Promise.all(Array.from({ length: Math.min(8, queue.length) }, async () => {
      for (let r = queue.shift(); r; r = queue.shift()) {
        const sub = r.p.push!
        const res = await pusher.deliver({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        if (res === 'ok') { sent++; sentIds.push(r.p.id) } else if (res === 'gone') { removed++; await registry.clearPushByEndpoint(sub.endpoint) } else failed++
      }
    }))
    const at = new Date(nowMs()).toISOString()
    if (sentIds.length) await registry.markPromoSent(sentIds, at)
    if (!targets.length) return { matched: matched.length, targeted: 0, sent: 0, failed: 0, removed: 0 } // ارسالِ بدون گیرنده در سابقه نمی‌آید
    const entry = { at, title: b.data.title, body: b.data.body, url: b.data.url, filters: b.data.filters, matched: matched.length, targeted: targets.length, sent, failed, removed }
    try { const old = JSON.parse((await store.getKV(LOG_KEY)) ?? '[]') as unknown[]; await store.setKV(LOG_KEY, JSON.stringify([entry, ...(Array.isArray(old) ? old : [])].slice(0, LOG_MAX))) } catch { /* ثبت سابقه اختیاری است */ }
    return { matched: matched.length, targeted: targets.length, sent, failed, removed }
  })
  adm.get('/audience/history', async () => { try { const v = JSON.parse((await store.getKV(LOG_KEY)) ?? '[]'); return { items: Array.isArray(v) ? v : [] } } catch { return { items: [] } } })

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
export type { Person, ConsentKind }
