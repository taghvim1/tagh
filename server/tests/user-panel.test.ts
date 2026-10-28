import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { createJsonStore } from '../src/store/jsonStore.js'
import { computeInterests } from '../../src/analytics/interest.js'
import { consentOf, interestsOf, profileOf } from '../src/analytics/profile.js'
import type { ConsentRow, EventRow } from '../src/store/types.js'

let app: FastifyInstance
afterEach(async () => { await app?.close() })
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0)
const ANON = 'inst-aaaaaaaaaaaa', ANON2 = 'inst-bbbbbbbbbbbb'
const ctx = { analytics: true, marketing: true, notifications: false, location: false }
const base = (a: string) => ({ anonymous_id: a, platform: 'pwa', app_version: '1.0.0' })
const ev = (id: string, type: string, extra: Record<string, unknown> = {}, a = ANON, at = '2026-10-28T10:00:00Z') => ({ event_id: id, anonymous_id: a, event_type: type, occurred_at: at, session_id: 's1', app_version: '1.0.0', platform: 'pwa', consent_context: ctx, ...extra })
const cons = (id: string, a: string, kind: string, granted: boolean, at: string, source = 'default') => ({ consent_id: id, subject_id: a, kind, granted, recorded_at: at, policy_version: '2026-10-v5', source })

async function mk() {
  const store = await createJsonStore()
  app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x', SECRETS_ENCRYPTION_KEY: 'k'.repeat(32) }), store, now: () => NOW })
  const post = (url: string, payload: unknown) => app.inject({ method: 'POST', url, payload: payload as object })
  const get = async (url: string) => (await app.inject({ method: 'GET', url })).json()
  const install = (a = ANON) => post('/api/installations', { installation_id: a, platform: 'pwa', app_version: '1.0.0' })
  const send = (a: string, events: unknown[], consents: unknown[] = []) => post('/api/events', { ...base(a), events, consents })
  return { store, post, get, install, send }
}

describe('پنل کاربران: وصل‌شدن رویدادها و رضایت‌ها', () => {
  it('پروفایل رفتاری، علاقه‌مندی‌ها و رضایت از رویدادهای ذخیره‌شده ساخته می‌شود', async () => {
    const t = await mk(); await t.install()
    await t.send(ANON, [
      ev('e1', 'view_destination', { destination_id: 3, category: 'جنگل', season: 'بهار', domestic_or_international: 'domestic' }),
      ev('e2', 'view_destination', { destination_id: 3 }), ev('e3', 'destination_dwell', { destination_id: 3, duration_sec: 40 }),
      ev('e4', 'favorite_add', { destination_id: 3, category: 'جنگل' }, ANON, '2026-10-28T10:01:00Z'),
      ev('e5', 'favorite_add', { destination_id: 7 }, ANON, '2026-10-28T10:02:00Z'), ev('e6', 'favorite_remove', { destination_id: 7 }, ANON, '2026-10-28T10:03:00Z'),
      ev('e7', 'select_season', { season: 'بهار' }), ev('e8', 'offer_click', { destination_id: 3 }), ev('e9', 'view_tour', { tour_id: 5 }), ev('e10', 'search', { query_length: 4 }),
    ], [cons('c1', ANON, 'analytics', true, '2026-10-28T09:00:00Z'), cons('c2', ANON, 'marketing', true, '2026-10-28T09:00:00Z'), cons('c3', ANON, 'notifications', true, '2026-10-28T09:00:00Z', 'default'), cons('c4', ANON, 'location', true, '2026-10-28T09:30:00Z', 'permission')])
    const d = await t.get(`/api/admin/users/${ANON}`)
    expect(d).toMatchObject({ event_count: 10, destinations_viewed: 1, offer_clicks: 1, searches: 1, viewed_tours: [5], seasons: { بهار: 1 } })
    expect(d.favorites).toEqual({ destination: [3], tour: [] }) // ۷ اضافه و حذف شد
    expect(d.viewed_destinations).toEqual([{ id: 3, views: 2, approx_seconds: 40 }])
    expect(d.top_interests).toContain('جنگل')
    // رضایت: رکورد قدیمیِ «پیش‌فرضِ روشن» برای اعلان معتبر نیست؛ موقعیت فقط با رکورد مبتنی بر مجوز
    expect(d.consent).toEqual({ analytics: true, marketing: true, notifications: null, location: true })
    expect(d.consent_log[0]).toMatchObject({ kind: 'location', granted: true, source: 'permission' })
    const list = await t.get('/api/admin/users')
    expect(list.items[0]).toMatchObject({ id: ANON, event_count: 10, destinations_viewed: 1 })
  })

  it('لغو رضایت تحلیل: رویدادهای بعدی ذخیره نمی‌شوند و پنل همان وضعیت را نشان می‌دهد', async () => {
    const t = await mk(); await t.install()
    await t.send(ANON, [ev('e1', 'view_calendar')], [cons('c1', ANON, 'analytics', true, '2026-10-28T09:00:00Z')])
    const r = await t.send(ANON, [ev('e2', 'view_calendar')], [cons('c2', ANON, 'analytics', false, '2026-10-28T11:00:00Z', 'privacy_page')])
    expect(r.json()).toMatchObject({ accepted: 0, dropped_no_consent: 1 })
    const d = await t.get(`/api/admin/users/${ANON}`)
    expect(d.event_count).toBe(1); expect(d.consent.analytics).toBe(false)
  })

  it('رویدادهای همهٔ نصب‌های یک حساب جمع می‌شود و صفحه‌بندی رویدادها کار می‌کند', async () => {
    const t = await mk(); await t.install(); await t.install(ANON2)
    await t.send(ANON, [ev('a1', 'view_destination', { destination_id: 1 }), ev('a2', 'view_destination', { destination_id: 2 }, ANON, '2026-10-28T10:05:00Z')], [cons('c1', ANON, 'analytics', true, '2026-10-28T09:00:00Z')])
    await t.send(ANON2, [ev('b1', 'view_destination', { destination_id: 9 }, ANON2, '2026-10-28T10:10:00Z')], [cons('c2', ANON2, 'analytics', true, '2026-10-28T09:00:00Z')])
    const p1 = await t.get(`/api/admin/users/${ANON}/events?page=1&pageSize=1`)
    expect(p1).toMatchObject({ total: 2, page: 1, pageSize: 1 }); expect(p1.items[0]).toMatchObject({ event_id: 'a2', event_type: 'view_destination', destination_id: 2 }) // تازه‌ترین اول
    expect((await t.get(`/api/admin/users/${ANON}/events?page=2&pageSize=1`)).items[0].event_id).toBe('a1')
    expect((await t.get(`/api/admin/users/${ANON2}`)).event_count).toBe(1) // نصب دیگر جدا مانده (مهمان)
    expect((await app.inject(`/api/admin/users/nope/events`)).statusCode).toBe(404)
  })

  it('آمار داشبورد از رویدادهای ۳۰ روز اخیر ساخته می‌شود (بینندهٔ یکتا، نه تعداد رویداد)', async () => {
    const t = await mk(); await t.install(); await t.install(ANON2)
    await t.send(ANON, [ev('a1', 'view_destination', { destination_id: 3, category: 'کویر' }), ev('a2', 'view_destination', { destination_id: 3, category: 'کویر' }), ev('a3', 'select_season', { season: 'پاییز' }), ev('a4', 'search'), ev('a5', 'favorite_add', { destination_id: 3 }),
      ev('old', 'view_destination', { destination_id: 99 }, ANON, '2026-08-01T10:00:00Z')], [cons('c1', ANON, 'analytics', true, '2026-10-28T09:00:00Z')])
    await t.send(ANON2, [ev('b1', 'view_destination', { destination_id: 3, category: 'کویر' }, ANON2), ev('b2', 'notification_open', {}, ANON2)], [cons('c2', ANON2, 'analytics', true, '2026-10-28T09:00:00Z')])
    const st = await t.get('/api/admin/users/stats')
    expect(st.topDestinations).toEqual([{ id: 3, viewers: 2 }]) // رویداد ۹۹ مربوط به ۳ ماه پیش است
    expect(st.topCategories).toEqual([{ name: 'کویر', count: 2 }]); expect(st.topSeasons).toEqual([{ name: 'پاییز', count: 1 }])
    expect(st).toMatchObject({ favorites: 1, searches: 1, notificationOpens: 1 })
  })

  it('پیش‌نمایش مخاطب: فقط با رضایت تبلیغاتی ثبت‌شده؛ بدون رکورد یعنی بدون رضایت', async () => {
    const t = await mk(); await t.install(); await t.install(ANON2); await t.install('inst-cccccccccccc')
    await t.send(ANON, [], [cons('c1', ANON, 'marketing', true, '2026-10-28T09:00:00Z')])
    await t.send(ANON2, [], [cons('c2', ANON2, 'marketing', false, '2026-10-28T09:00:00Z')])
    const r = (await t.post('/api/admin/audience/preview', {})).json()
    expect(r).toEqual({ matched: 3, eligible: 1, excluded: { noMarketingConsent: 2, unsubscribed: 0, frequencyCap: 0, inactiveAccount: 0 } })
  })

  it('حذف کاربر، رویدادها و رضایت‌هایش را هم پاک می‌کند', async () => {
    const t = await mk(); await t.install()
    await t.send(ANON, [ev('e1', 'view_calendar'), ev('e2', 'view_calendar')], [cons('c1', ANON, 'analytics', true, '2026-10-28T09:00:00Z')])
    expect(await t.store.eventStats()).toEqual({ events: 2, consents: 1 })
    const r = await app.inject({ method: 'DELETE', url: `/api/admin/users/${ANON}`, payload: { confirm: ANON } })
    expect(r.json()).toMatchObject({ ok: true, deleted_events: 2, deleted_consents: 1 })
    expect(await t.store.eventStats()).toEqual({ events: 0, consents: 0 })
  })

})

describe('منطق پروفایل سرور با کلاینت یکی است', () => {
  const rows: EventRow[] = [
    ['x1', 'view_destination', { category: 'جنگل', season: 'بهار' }, '2026-10-20T10:00:00Z'], ['x2', 'favorite_add', { category: 'جنگل', budget_range: 'اقتصادی' }, '2026-10-21T10:00:00Z'],
    ['x3', 'use_filter', { season: 'پاییز', domestic_or_international: 'domestic' }, '2026-09-01T10:00:00Z'], ['x4', 'favorite_remove', { budget_range: 'اقتصادی' }, '2026-10-22T10:00:00Z'], ['x5', 'view_tour', { category: 'کویر' }, '2026-10-25T10:00:00Z'],
  ].map(([event_id, event_type, props, occurred_at]) => ({ event_id, event_type, props, occurred_at, anonymous_id: 'a', session_id: 's', app_version: '1', platform: 'web', consent_context: {}, received_at: occurred_at }) as EventRow)
  it('امتیاز علایق سمت سرور برابر computeInterests کلاینت است', () => {
    const now = new Date('2026-10-29T12:00:00Z')
    const client = computeInterests(rows.map((r) => ({ event_id: r.event_id, event_type: r.event_type, occurred_at: r.occurred_at, ...r.props })) as never, undefined, { now })
    const server = interestsOf(rows, now)
    expect(server.map((i) => [i.interest_key, i.score, i.confidence, i.source])).toEqual(client.map((i) => [i.interest_key, i.score, i.confidence, i.source]))
  })
  it('رضایت اعلان/موقعیت فقط از رکورد مبتنی بر مجوز؛ آخرین رکورد بر اساس زمان', () => {
    const c = (kind: string, granted: boolean, recorded_at: string, source: string): ConsentRow => ({ consent_id: kind + recorded_at, subject_id: 'a', kind, granted, recorded_at, policy_version: 'v', source, received_at: recorded_at })
    expect(consentOf([c('location', true, '2026-10-01T00:00:00Z', 'permission'), c('location', false, '2026-10-02T00:00:00Z', 'permission'), c('notifications', true, '2026-10-03T00:00:00Z', 'privacy_page'), c('marketing', true, '2026-10-01T00:00:00Z', 'default')]))
      .toEqual({ analytics: null, marketing: true, notifications: null, location: false })
    expect(profileOf([], new Date()).event_count).toBe(0)
  })
})
