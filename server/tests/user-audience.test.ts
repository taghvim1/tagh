import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.hoisted(() => ({ sendNotification: vi.fn(async (..._a: unknown[]) => ({ statusCode: 201 })) }))
vi.mock('web-push', () => ({ default: { generateVAPIDKeys: () => ({ publicKey: 'pub', privateKey: 'priv' }), sendNotification: push.sendNotification } }))

import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { createJsonStore } from '../src/store/jsonStore.js'
import { matches as clientMatches } from '../../src/analytics/admin/query.js'
import type { ProfileRecord } from '../../src/analytics/admin/profiles.js'
import { computeInterests } from '../../src/analytics/interest.js'
import { matchesRow } from '../src/analytics/audience.js'
import { consentOf, profileOf } from '../src/analytics/profile.js'
import type { Person } from '../src/auth/registry.js'
import type { EventRow } from '../src/store/types.js'

let app: FastifyInstance
beforeEach(() => { push.sendNotification.mockClear(); push.sendNotification.mockImplementation(async () => ({ statusCode: 201 })) })
afterEach(async () => { await app?.close() })
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0)
const TP = 'inst-aaaaaaaaaaaa', AN = 'anon_11111111-aaaa', TP2 = 'inst-bbbbbbbbbbbb', AN2 = 'anon_22222222-bbbb'
const ctx = { analytics: true, marketing: true, notifications: true, location: false }
const ev = (id: string, type: string, a: string, extra: Record<string, unknown> = {}, at = '2026-10-28T10:00:00Z') => ({ event_id: id, anonymous_id: a, event_type: type, occurred_at: at, session_id: 's1', app_version: '1.0.0', platform: 'pwa', consent_context: ctx, ...extra })
const cons = (id: string, a: string, kind: string, granted: boolean, source = 'default', at = '2026-10-28T09:00:00Z') => ({ consent_id: id, subject_id: a, kind, granted, recorded_at: at, policy_version: '2026-10-v5', source })
const SUB = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', keys: { p256dh: 'BPubKeyAAAAAAAAAAAAAAAA', auth: 'AuthKeyAAAAAAAA' } }

async function mk(env: Record<string, string> = {}) {
  const store = await createJsonStore(), clock = { t: NOW }
  app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x', SECRETS_ENCRYPTION_KEY: 'k'.repeat(32), ...env }), store, now: () => clock.t })
  const fresh = () => { clock.t += 21_000 } // نمای کلی ۲۰ ثانیه کش می‌شود؛ ساعت تست باید جلو برود
  const post = (url: string, payload: unknown, headers: Record<string, string> = {}) => app.inject({ method: 'POST', url, payload: payload as object, headers })
  const get = async (url: string) => { fresh(); return (await app.inject({ method: 'GET', url })).json() }
  const ping = (tp = TP, an: string | undefined = AN, headers: Record<string, string> = {}) => post('/api/installations', { installation_id: tp, ...(an ? { analytics_id: an } : {}), platform: 'pwa', app_version: '1' }, headers)
  const send = (a: string, events: unknown[], consents: unknown[] = []) => post('/api/events', { anonymous_id: a, platform: 'pwa', app_version: '1.0.0', events, consents })
  const list = async (filters: object = {}, extra: object = {}) => get('/api/admin/users?q=' + encodeURIComponent(JSON.stringify({ filters, ...extra })))
  const preview = async (filters: object = {}) => { fresh(); return (await post('/api/admin/audience/preview', filters)).json() }
  return { store, clock, post, get, ping, send, list, preview }
}

describe('وصل‌شدن شناسهٔ ردیاب به نصب (علت دیده‌نشدن علایق)', () => {
  it('رویدادها با شناسهٔ ردیاب می‌آیند و پس از ثبت نصب با analytics_id به همان کاربر وصل می‌شوند', async () => {
    const t = await mk(); await t.ping()
    await t.send(AN, [ev('e1', 'view_destination', AN, { destination_id: 3, category: 'جنگل' }), ev('e2', 'favorite_add', AN, { destination_id: 3, category: 'جنگل' })], [cons('c1', AN, 'analytics', true)])
    const d = await t.get(`/api/admin/users/${TP}`)
    expect(d.anonymous_ids).toEqual([TP, AN]); expect(d.event_count).toBe(2); expect(d.top_interests).toContain('جنگل')
  })
  it('رویدادهای قبل از ثبت نصب هم بعداً وصل می‌شوند؛ شناسهٔ شخص دیگر دزدیده نمی‌شود', async () => {
    const t = await mk()
    await t.send(AN, [ev('e1', 'view_calendar', AN)], [cons('c1', AN, 'analytics', true)]) // هنوز نصبی ثبت نشده
    expect((await t.get('/api/admin/users/stats')).diagnostics.unlinked_analytics_ids).toBe(1)
    await t.ping(); expect((await t.get(`/api/admin/users/${TP}`)).event_count).toBe(1)
    await t.ping(TP2, AN) // کسی که شناسهٔ ردیابِ دیگری را ادعا می‌کند
    expect((await t.get(`/api/admin/users/${TP2}`)).anonymous_ids).toEqual([TP2])
    expect((await t.get(`/api/admin/users/${TP}`)).anonymous_ids).toContain(AN)
  })
})

describe('جلوگیری از ثبت نصب‌های ساختگی', () => {
  it('ربات/خزنده، شناسهٔ نامعتبر و سقف ساعتی', async () => {
    const t = await mk({ INSTALL_MAX_PER_HOUR: '2' })
    expect((await t.ping(TP, AN, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).statusCode).toBe(204)
    expect((await t.ping(TP, AN, { 'user-agent': 'Mozilla/5.0 HeadlessChrome/120 Lighthouse' })).statusCode).toBe(204)
    expect((await t.get('/api/admin/users/stats')).total).toBe(0) // هیچ‌کدام ثبت نشد
    expect((await t.post('/api/installations', { installation_id: 'has space in id!', platform: 'web' })).statusCode).toBe(400)
    await t.ping(TP, AN, { 'user-agent': 'Mozilla/5.0 Chrome/120' }); await t.ping(TP2, AN2, { 'user-agent': 'Mozilla/5.0 Chrome/120' }); await t.ping('inst-cccccccccccc', undefined, { 'user-agent': 'Mozilla/5.0 Chrome/120' })
    expect((await t.get('/api/admin/users/stats')).total).toBe(2) // سومی به سقف خورد
  })
  it('پاک‌سازی مهمان‌های یک‌بار-بازشده و برنگشته (با رویدادهایشان)؛ مهمان برگشته دست‌نخورده', async () => {
    const t = await mk()
    await t.ping(TP, AN); await t.ping(TP2, AN2); t.clock.t += 31 * 60_000; await t.ping(TP2, AN2) // دومی دو بار باز شده
    await t.send(AN, [ev('e1', 'view_calendar', AN)], [cons('c1', AN, 'analytics', true)])
    expect((await t.get('/api/admin/users/stale-count?days=3')).count).toBe(0) // هنوز تازه‌اند
    t.clock.t += 4 * 86_400_000
    expect((await t.get('/api/admin/users/stale-count?days=3')).count).toBe(1) // فقط یک‌بار-بازشده‌ی برنگشته
    expect((await t.post('/api/admin/users/cleanup', { olderThanDays: 3 })).statusCode).toBe(400) // بدون تأیید پاک نمی‌شود
    expect((await t.post('/api/admin/users/cleanup', { olderThanDays: 3, confirm: true })).json()).toEqual({ removed: 1, deleted_events: 1, deleted_consents: 1 })
    expect((await t.get('/api/admin/users/stats')).total).toBe(1)
    expect((await t.get(`/api/admin/users/${TP2}`)).id).toBe(TP2)
    expect((await app.inject(`/api/admin/users/${TP}`)).statusCode).toBe(404)
  })
})

describe('فیلتر و مرتب‌سازی واقعی کاربران', () => {
  async function seed() {
    const t = await mk(); await t.ping(TP, AN); await t.ping(TP2, AN2)
    await t.send(AN, [
      ...Array.from({ length: 12 }, (_, i) => ev('a' + i, 'view_destination', AN, { destination_id: 3, category: 'جنگل', season: 'بهار', budget_range: 'اقتصادی', domestic_or_international: 'domestic' })),
      ev('af', 'favorite_add', AN, { destination_id: 3, category: 'جنگل' }), ev('as', 'select_season', AN, { season: 'بهار' }),
    ], [cons('c1', AN, 'analytics', true), cons('c2', AN, 'marketing', true)])
    await t.send(AN2, [ev('b1', 'view_destination', AN2, { destination_id: 9, category: 'کویر', season: 'پاییز' })], [cons('c3', AN2, 'analytics', true), cons('c4', AN2, 'marketing', false, 'privacy_page')])
    return t
  }
  it('علایق، مقصد دیده‌شده، علاقه‌مندی، تعامل و رضایت واقعاً فیلتر می‌کنند', async () => {
    const t = await seed()
    const ids = async (f: object) => (await t.list(f)).items.map((u: { id: string }) => u.id)
    expect(await ids({ destType: 'جنگل' })).toEqual([TP]); expect(await ids({ destType: 'کویر' })).toEqual([]) // کویر فقط یک مشاهده (امتیاز < ۳)
    expect(await ids({ season: 'بهار' })).toEqual([TP]); expect(await ids({ budget: 'اقتصادی', scope: 'داخلی' })).toEqual([TP])
    expect(await ids({ viewedDestinationId: 9 })).toEqual([TP2]); expect(await ids({ hasFavorites: true })).toEqual([TP]); expect(await ids({ engagement: 'medium' })).toEqual([TP])
    expect(await ids({ marketingConsent: true })).toEqual([TP]); expect(await ids({ marketingConsent: false })).toEqual([TP2])
    expect(await ids({ minSessions: 1 })).toHaveLength(2); expect(await ids({ country: 'ایران' })).toEqual([]) // فیلدِ ذخیره‌نشده هرگز مطابقت ندارد
  })
  it('مرتب‌سازی بر اساس رویداد و مقصد، و آمار علایق مخاطبان', async () => {
    const t = await seed()
    expect((await t.list({}, { sort: 'event_count', dir: 'desc' })).items.map((u: { id: string }) => u.id)).toEqual([TP, TP2])
    expect((await t.list({}, { sort: 'event_count', dir: 'asc' })).items.map((u: { id: string }) => u.id)).toEqual([TP2, TP])
    const st = await t.get('/api/admin/users/stats')
    expect(st.interests).toContainEqual({ dimension: 'type', value: 'جنگل', people: 1 }); expect(st.interests).toContainEqual({ dimension: 'season', value: 'بهار', people: 1 })
    expect(st.diagnostics).toMatchObject({ events_total: 15, people_with_events: 2, analytics_granted: 2, marketing_granted: 1, unlinked_analytics_ids: 0 })
  })
})

describe('مخاطب هدف: اشتراک، پیش‌نمایش و ارسال واقعی', () => {
  async function ready() {
    const t = await mk(); await t.ping(TP, AN)
    await t.send(AN, [ev('e1', 'view_destination', AN, { destination_id: 3, category: 'جنگل' })], [cons('c1', AN, 'analytics', true), cons('c2', AN, 'marketing', true), cons('c3', AN, 'notifications', true, 'permission')])
    return t
  }
  it('آدرس اشتراک فقط از سرویس‌های Push شناخته‌شده پذیرفته می‌شود (SSRF)', async () => {
    const t = await ready()
    for (const endpoint of ['http://fcm.googleapis.com/x', 'https://169.254.169.254/latest', 'https://evil.example/push', 'https://fcm.googleapis.com.evil.com/x', 'https://user:pw@fcm.googleapis.com/x'])
      expect((await t.post('/api/push/subscribe', { installation_id: TP, subscription: { ...SUB, endpoint } })).statusCode).toBe(400)
    expect((await t.post('/api/push/subscribe', { installation_id: 'inst-unknown1234', subscription: SUB })).statusCode).toBe(404)
    expect((await t.post('/api/push/subscribe', { installation_id: TP, subscription: SUB }, { origin: 'http://evil.example', host: 'localhost' })).statusCode).toBe(403)
    expect((await t.post('/api/push/subscribe', { installation_id: TP, subscription: SUB })).statusCode).toBe(204)
  })
  it('بدون اشتراک واجد شرایط نیست؛ با اشتراک می‌شود؛ ارسال، سقف تکرار و لغو رضایت', async () => {
    const t = await ready()
    expect(await t.preview()).toMatchObject({ matched: 1, eligible: 0, excluded: { noPushSubscription: 1 } })
    await t.post('/api/push/subscribe', { installation_id: TP, subscription: SUB })
    expect(await t.preview()).toMatchObject({ matched: 1, eligible: 1 })
    expect(await t.preview({ destType: 'کویر' })).toMatchObject({ matched: 0, eligible: 0 }) // فیلتر در پیش‌نمایش اعمال می‌شود
    const draft = { title: 'تخفیف پاییز', body: 'تورهای جنگلی', url: '/tours', filters: {} }
    expect((await t.post('/api/admin/audience/send', { ...draft })).statusCode).toBe(400) // بدون تأیید ارسال نمی‌شود
    expect((await t.post('/api/admin/audience/send', { ...draft, confirm: true, url: 'https://evil.example' })).statusCode).toBe(400) // فقط مسیر داخلی
    const r = await t.post('/api/admin/audience/send', { ...draft, confirm: true })
    expect(r.json()).toEqual({ matched: 1, targeted: 1, sent: 1, failed: 0, removed: 0 })
    expect(push.sendNotification).toHaveBeenCalledTimes(1)
    const [sub, payload] = push.sendNotification.mock.calls[0] as [{ endpoint: string }, string]
    expect(sub.endpoint).toBe(SUB.endpoint); expect(JSON.parse(payload)).toMatchObject({ title: 'تخفیف پاییز', url: '/tours?from=push' })
    // سقف تکرار ۷ روز
    expect(await t.preview()).toMatchObject({ eligible: 0, excluded: { frequencyCap: 1 } })
    expect((await t.post('/api/admin/audience/send', { ...draft, confirm: true })).json()).toMatchObject({ targeted: 0, sent: 0 })
    expect((await t.get('/api/admin/audience/history')).items[0]).toMatchObject({ title: 'تخفیف پاییز', sent: 1 })
  })
  it('لغو رضایت تبلیغاتی گیرنده را حذف می‌کند؛ اشتراک منقضی (۴۱۰) پاک می‌شود', async () => {
    const t = await ready(); await t.post('/api/push/subscribe', { installation_id: TP, subscription: SUB })
    await t.send(AN, [], [cons('c9', AN, 'marketing', false, 'privacy_page', '2026-10-28T11:00:00Z')])
    expect(await t.preview()).toMatchObject({ eligible: 0, excluded: { noMarketingConsent: 1 } })
    await t.send(AN, [], [cons('c10', AN, 'marketing', true, 'privacy_page', '2026-10-28T12:00:00Z')])
    push.sendNotification.mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }))
    const r = await t.post('/api/admin/audience/send', { title: 'سلام', body: 'متن', filters: {}, confirm: true })
    expect(r.json()).toMatchObject({ targeted: 1, sent: 0, removed: 1 })
    expect((await t.get(`/api/admin/users/${TP}`)).push.subscribed).toBe(false)
  })
  it('اعلان آزمایشی به یک کاربر و لغو اشتراک با /push/unsubscribe', async () => {
    const t = await ready()
    expect((await t.post(`/api/admin/users/${TP}/push-test`, {})).statusCode).toBe(409) // اشتراک ندارد
    await t.post('/api/push/subscribe', { installation_id: TP, subscription: SUB })
    expect((await t.post(`/api/admin/users/${TP}/push-test`, {})).json()).toEqual({ result: 'ok' })
    expect((await t.get(`/api/admin/users/${TP}`)).reach).toBe('eligible')
    expect((await t.post('/api/push/unsubscribe', { installation_id: TP })).statusCode).toBe(204)
    expect((await t.get(`/api/admin/users/${TP}`)).push).toMatchObject({ subscribed: false })
  })
})

describe('فیلتر سرور با فیلتر کلاینت (matches) یکی است', () => {
  const NOWD = new Date('2026-10-29T12:00:00Z')
  const rowsOf = (list: Array<[string, string, Record<string, unknown>, string]>): EventRow[] => list.map(([event_id, event_type, props, occurred_at]) => ({ event_id, event_type, props, occurred_at, anonymous_id: 'a', session_id: 's', app_version: '1', platform: 'web', consent_context: {}, received_at: occurred_at }))
  const events = rowsOf([
    ...Array.from({ length: 6 }, (_, i): [string, string, Record<string, unknown>, string] => ['v' + i, 'view_destination', { destination_id: 3, category: 'جنگل', season: 'بهار', domestic_or_international: 'domestic' }, '2026-10-27T10:00:00Z']),
    ['f1', 'favorite_add', { destination_id: 3, category: 'جنگل' }, '2026-10-28T10:00:00Z'], ['b1', 'select_budget', { budget_range: 'لوکس' }, '2026-10-28T11:00:00Z'],
  ])
  const person: Person = { id: 'p1', anonymous_ids: ['a'], status: 'registered', state: 'active', first_seen_at: '2026-10-01T00:00:00Z', last_seen_at: '2026-10-28T12:00:00Z', registered_at: '2026-10-05T00:00:00Z', platform: 'pwa', app_version: '1', first_name: 'علی', last_name: 'رضایی', city: 'تهران', profile_complete: true, sessions: 3 }
  const consentRows = [{ consent_id: 'c', subject_id: 'a', kind: 'marketing', granted: true, recorded_at: '2026-10-02T00:00:00Z', policy_version: 'v', source: 'default', received_at: '2026-10-02T00:00:00Z' }]
  const prof = profileOf(events, NOWD), consent = consentOf(consentRows)
  const acts = events.map((e) => ({ event_id: e.event_id, event_type: e.event_type, occurred_at: e.occurred_at, session_id: 's', ...e.props })) as never[]
  const rec: ProfileRecord = { id: 'p1', anonymous_ids: ['a'], status: 'registered', state: 'active', display_name: 'علی رضایی', city: 'تهران', first_seen_at: person.first_seen_at, registered_at: person.registered_at, last_active_at: person.last_seen_at, events: acts, favorites: prof.favorites, interests: computeInterests(acts, undefined, { now: NOWD }), consent: { analytics: true, personalization: false, marketing: true } as never, notifications: {} as never, merge_logs: [] }
  const cases: Array<Record<string, unknown>> = [{}, { status: 'registered' }, { status: 'guest' }, { city: 'تهران' }, { city: 'شیراز' }, { destType: 'جنگل' }, { destType: 'کویر' }, { season: 'بهار' }, { budget: 'لوکس' }, { scope: 'داخلی' }, { scope: 'خارجی' }, { viewedDestinationId: 3 }, { viewedDestinationId: 4 }, { hasFavorites: true }, { hasFavorites: false }, { engagement: 'low' }, { engagement: 'medium' }, { marketingConsent: true }, { marketingConsent: false }, { lastActiveWithinDays: 7 }, { lastActiveWithinDays: 0 }, { firstSeenWithinDays: 7 }, { active: true }, { query: 'علی' }, { query: 'zzz' }, { destType: 'جنگل', season: 'بهار', hasFavorites: true }]
  it.each(cases.map((c) => [JSON.stringify(c), c] as const))('فیلتر %s', (_n, f) => {
    // minSessions در کلاینت از رویدادها و در سرور از شمارندهٔ باز شدن می‌آید؛ عمداً در این مقایسه نیست
    expect(matchesRow({ p: person, prof, consent }, f as never, NOWD.getTime())).toBe(clientMatches(rec, f as never, NOWD))
  })
})
