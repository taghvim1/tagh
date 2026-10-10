import assert from 'node:assert/strict'
import { test } from 'node:test'
import { memoryKV } from '../src/analytics/ids'
import { getOrCreateInstallation } from '../src/analytics/installation'
import { createTracker, notConnectedTransport, OUTBOX_MAX, type Transport } from '../src/analytics/tracker'
import { computeInterests } from '../src/analytics/interest'
import { mergeGuestIntoAccount, type AccountState, type GuestBundle } from '../src/analytics/merge'
import { can } from '../src/analytics/admin/access'
import { buildDemoProfiles } from '../src/analytics/admin/demoData'
import { createDemoApi, createRemoteApi, ApiUnavailableError, NotReadyError } from '../src/analytics/admin/api'
import { dashboardStats, listProfiles, previewAudience } from '../src/analytics/admin/query'
import type { ActivityEvent } from '../src/analytics/types'

const T0 = new Date('2026-10-10T10:00:00Z')
const mk = (kv = memoryKV(), transport?: Transport, t = { v: T0 }) => ({ kv, t, tr: createTracker({ kv, transport, now: () => t.v }) })
const optIn = (tr: ReturnType<typeof createTracker>) => tr.setConsent('analytics', true)

test('شناسه مهمان در اولین اجرا ساخته و در مراجعات بعدی پایدار است', () => {
  const kv = memoryKV()
  const a = getOrCreateInstallation(kv, T0)
  const b = getOrCreateInstallation(kv, new Date(T0.getTime() + 86400_000))
  assert.match(a.anonymous_id, /^anon_/)
  assert.equal(a.anonymous_id, b.anonymous_id)
  assert.equal(a.first_seen_at, b.first_seen_at)
  assert.ok(b.last_seen_at > a.last_seen_at)
  assert.equal(a.account_status, 'guest')
  assert.notEqual(getOrCreateInstallation(memoryKV(), T0).anonymous_id, a.anonymous_id)
})

test('بدون رضایت تحلیل چیزی ثبت نمی‌شود؛ با رضایت ثبت می‌شود و لغو، صف را پاک می‌کند', () => {
  const { tr } = mk()
  assert.equal(tr.track('app_open'), null)
  assert.equal(tr.pending(), 0)
  optIn(tr)
  const e = tr.track('view_destination', { destination_id: 3, category: 'جنگل' })
  assert.ok(e && e.event_id && e.occurred_at.endsWith('Z') && e.session_id)
  assert.equal(tr.pending(), 1)
  tr.setConsent('analytics', false)
  assert.equal(tr.pending(), 0)
  assert.equal(tr.track('app_open'), null)
})

test('رضایت‌ها جدا از هم‌اند و پیش‌فرض همه خاموش است', () => {
  const { tr } = mk()
  assert.deepEqual(tr.consent(), { analytics: false, marketing: false, location: false })
  tr.setConsent('marketing', true)
  assert.deepEqual(tr.consent(), { analytics: false, marketing: true, location: false })
})

test('رویداد تکراری پشت‌سرهم ثبت نمی‌شود و داده غیرمجاز دور ریخته می‌شود', () => {
  const { tr, t } = mk()
  optIn(tr)
  assert.ok(tr.track('view_destination', { destination_id: 1 }))
  assert.equal(tr.track('view_destination', { destination_id: 1 }), null)
  t.v = new Date(T0.getTime() + 5000)
  assert.ok(tr.track('view_destination', { destination_id: 1 }))
  const e = tr.track('search', { query_length: 5, ...({ query: 'متن حساس', email: 'a@b.c' } as object) })!
  assert.equal(e.query_length, 5)
  assert.ok(!('query' in e) && !('email' in e))
  assert.equal(tr.track('bogus' as never), null)
})

test('نشست پس از ۳۰ دقیقه بی‌فعالیتی عوض می‌شود', () => {
  const { tr, t } = mk()
  optIn(tr)
  const a = tr.track('app_open')!
  t.v = new Date(T0.getTime() + 10 * 60_000)
  const b = tr.track('view_calendar')!
  t.v = new Date(T0.getTime() + 60 * 60_000 + 10 * 60_000)
  const c = tr.track('view_suggestions')!
  assert.equal(a.session_id, b.session_id)
  assert.notEqual(b.session_id, c.session_id)
})

test('قطع ارتباط با سرور: رویدادها حفظ می‌شوند؛ پس از اتصال فقط ارسال‌شده‌ها پاک می‌شوند', async () => {
  const kv = memoryKV()
  const t = { v: T0 }
  let up = false
  const sent: ActivityEvent[][] = []
  const transport: Transport = { send: async (b) => { if (!up) throw new Error('net'); sent.push(b) } }
  const tr = createTracker({ kv, transport, now: () => t.v })
  optIn(tr); tr.track('app_open')
  assert.equal((await tr.flush()).status, 'failed')
  assert.equal(tr.pending(), 1)
  up = true
  assert.equal((await tr.flush()).status, 'sent')
  assert.equal(tr.pending(), 0)
  assert.equal(sent.length, 1)
  const nc = mk(); optIn(nc.tr); nc.tr.track('app_open')
  assert.equal((await nc.tr.flush()).code, 'BACKEND_NOT_CONNECTED')
  assert.equal(nc.tr.pending(), 1)
  void notConnectedTransport
})

test('صف محلی سقف دارد', () => {
  const { tr, t } = mk()
  optIn(tr)
  for (let i = 0; i < OUTBOX_MAX + 20; i++) { t.v = new Date(T0.getTime() + i * 3000); tr.track('view_destination', { destination_id: i }) }
  assert.equal(tr.pending(), OUTBOX_MAX)
})

test('درخواست حذف داده: پاک‌سازی محلی، لغو رضایت و ثبت درخواست برای سرور', () => {
  const { tr, kv } = mk()
  optIn(tr); tr.setConsent('marketing', true); tr.track('app_open')
  const id = tr.installation().anonymous_id
  const req = tr.deleteMyData()
  assert.equal(req.anonymous_id, id)
  assert.equal(tr.pending(), 0)
  assert.deepEqual(tr.consent(), { analytics: false, marketing: false, location: false })
  assert.equal(tr.deletionRequest()?.status, 'pending_server')
  assert.notEqual(tr.installation().anonymous_id, id)
  assert.equal(kv.getItem('taghvim-outbox-v1'), null)
})

const ev = (id: string, anon: string, extra: Partial<ActivityEvent> = {}): ActivityEvent => ({
  event_id: id, anonymous_id: anon, event_type: 'view_destination', occurred_at: '2026-10-09T10:00:00Z', session_id: 's1', app_version: '1', platform: 'web',
  consent_context: { analytics: true, marketing: false, location: false }, ...extra })
const prefs = (id: string, fav: number[] = [], explicit: string[] = [], hidden: string[] = []) => ({ subject_id: id, explicit_interests: explicit, hidden_interests: hidden, favorites: { destination: fav, tour: [] as number[] }, updated_at: 'x' })
const account = (uid = 'u1', over: Partial<AccountState> = {}): AccountState => ({ user_id: uid, events: [], preferences: prefs(uid), linked_installations: [], merge_logs: [], ...over })
const guest = (anon = 'anon_1', over: Partial<GuestBundle> = {}): GuestBundle => ({
  installation: { ...getOrCreateInstallation(memoryKV(), T0), anonymous_id: anon }, events: [ev('e1', anon), ev('e2', anon)], preferences: prefs(anon, [1, 2]), ...over })

test('ادغام مهمان پس از احراز هویت: رویدادها و علاقه‌مندی‌ها منتقل و سوابق مهمان حفظ می‌شوند', () => {
  const g = guest()
  const r = mergeGuestIntoAccount({ account: account(), guest: g, authVerified: true, installationOwners: {}, now: T0 })
  assert.equal(r.log.status, 'success'); assert.equal(r.log.events_linked, 2)
  assert.ok(r.account.events.every((e) => e.user_id === 'u1'))
  assert.deepEqual(r.account.preferences.favorites.destination, [1, 2])
  assert.equal(r.guest.events.length, 2) // مهمان حذف نشده
  assert.ok(r.guest.events.every((e) => e.user_id === undefined))
  assert.equal(r.guest.installation.user_id, 'u1')
})

test('ادغام تکرارپذیر است و دوبار چیزی اضافه نمی‌کند', () => {
  const g = guest()
  const r1 = mergeGuestIntoAccount({ account: account(), guest: g, authVerified: true, installationOwners: {}, now: T0 })
  const r2 = mergeGuestIntoAccount({ account: r1.account, guest: g, authVerified: true, installationOwners: {}, now: T0 })
  assert.equal(r2.log.status, 'already_merged')
  assert.equal(r2.account.events.length, 2)
  assert.deepEqual(r2.account.preferences.favorites.destination, [1, 2])
})

test('بدون احراز هویت یا برای شناسهٔ متعلق به حساب دیگر، ادغام رد می‌شود', () => {
  const base = { account: account(), guest: guest(), installationOwners: {}, now: T0 }
  const a = mergeGuestIntoAccount({ ...base, authVerified: false })
  assert.equal(a.log.reason_code, 'AUTH_REQUIRED'); assert.equal(a.account.events.length, 0)
  const b = mergeGuestIntoAccount({ ...base, authVerified: true, installationOwners: { anon_1: 'other' } })
  assert.equal(b.log.reason_code, 'INSTALLATION_OWNED_BY_OTHER_ACCOUNT'); assert.equal(b.account.events.length, 0)
  const c = mergeGuestIntoAccount({ ...base, authVerified: true, guest: guest('anon_1', { events: [ev('x', 'anon_OTHER')] }) })
  assert.equal(c.log.reason_code, 'FOREIGN_EVENTS_IN_BUNDLE')
  // شباهت نام/شهر/دستگاه هیچ تأثیری ندارد: ادغام فقط با authVerified و شناسه
  assert.equal(c.account.events.length, 0)
})

test('علاقه‌مندی‌ها و ترجیحات صریح حساب هنگام ادغام حفظ می‌شود', () => {
  const acc = account('u1', { preferences: prefs('u1', [9], ['type:کویر'], ['type:جنگل']) })
  const g = guest('anon_1', { preferences: prefs('anon_1', [1], ['type:جنگل', 'season:بهار']) })
  const r = mergeGuestIntoAccount({ account: acc, guest: g, authVerified: true, installationOwners: {}, now: T0 })
  assert.deepEqual(r.account.preferences.favorites.destination.sort(), [1, 9])
  assert.ok(r.account.preferences.explicit_interests.includes('type:کویر'))
  assert.ok(!r.account.preferences.explicit_interests.includes('type:جنگل')) // حذف‌شدهٔ کاربر برنمی‌گردد
  assert.ok(r.account.preferences.hidden_interests.includes('type:جنگل'))
})

test('رویدادهای تکراری هنگام ادغام شمرده نمی‌شوند و خطا داده‌ای را حذف نمی‌کند', () => {
  const acc = account('u1', { events: [{ ...ev('e1', 'anon_1'), user_id: 'u1' }] })
  const r = mergeGuestIntoAccount({ account: acc, guest: guest(), authVerified: true, installationOwners: {}, now: T0 })
  assert.equal(r.log.events_linked, 1); assert.equal(r.log.events_skipped_duplicates, 1)
  const bad = guest(); (bad as { events: unknown }).events = null
  const f = mergeGuestIntoAccount({ account: account(), guest: bad, authVerified: true, installationOwners: {}, now: T0 })
  assert.equal(f.log.status, 'failed'); assert.equal(f.account.events.length, 0); assert.equal(f.guest, bad)
})

test('امتیاز علایق: مشاهده اطمینان کم، علاقه صریح جدا، حذف‌شده‌ها رعایت می‌شوند', () => {
  const evs = [ev('a', 'x', { category: 'جنگل' }), ev('b', 'x', { category: 'کویر', event_type: 'favorite_add' }), ev('c', 'x', { category: 'کویر' }), ev('a', 'x', { category: 'جنگل' })]
  const r = computeInterests(evs, undefined, { now: T0 })
  const forest = r.find((i) => i.interest_key === 'type:جنگل')!
  assert.equal(forest.source, 'inferred'); assert.equal(forest.supporting_event_count, 1); assert.ok(forest.confidence < 0.3)
  assert.equal(r.find((i) => i.interest_key === 'type:کویر')!.source, 'explicit')
  assert.ok(!computeInterests(evs, { explicit_interests: [], hidden_interests: ['type:جنگل'] }, { now: T0 }).some((i) => i.interest_key === 'type:جنگل'))
  assert.ok(computeInterests(evs, undefined, { now: T0, weights: { view_destination: 10 } })[0].score >= forest.score)
})

const NOW = new Date('2026-10-10T12:00:00Z')
const data = buildDemoProfiles(NOW)

test('فیلتر، مرتب‌سازی و صفحه‌بندی لیست کاربران', () => {
  const all = listProfiles(data, { pageSize: 10 }, NOW)
  assert.equal(all.items.length, 10); assert.equal(all.total, data.length)
  const p2 = listProfiles(data, { pageSize: 10, page: 2 }, NOW)
  assert.notEqual(p2.items[0].id, all.items[0].id)
  const g = listProfiles(data, { filters: { status: 'guest' }, pageSize: 100 }, NOW)
  assert.ok(g.items.every((u) => u.status === 'guest')); assert.ok(g.total > 0 && g.total < data.length)
  const sorted = listProfiles(data, { sort: 'sessions', dir: 'asc', pageSize: 100 }, NOW).items.map((u) => u.sessions)
  assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b))
  const city = listProfiles(data, { filters: { city: 'تهران' }, pageSize: 100 }, NOW)
  assert.ok(city.items.length < data.length && city.items.every((u) => u.city === 'تهران')) // بدون شهر در این دسته نمی‌آید
  assert.equal(listProfiles(data, { pageSize: 1000 }, NOW).pageSize, 100)
  const stats = dashboardStats(data, NOW)
  assert.equal(stats.guests + stats.registered, stats.total)
  assert.ok(stats.dau <= stats.wau && stats.wau <= stats.mau && stats.mau <= stats.total)
})

test('پیش‌نمایش مخاطب فقط افراد دارای رضایت تبلیغاتی را واجد شرایط می‌داند و داده شخصی برنمی‌گرداند', () => {
  const a = previewAudience(data, {}, NOW)
  assert.equal(a.matched, a.eligible + a.excluded.noMarketingConsent + a.excluded.unsubscribed + a.excluded.frequencyCap + a.excluded.inactiveAccount)
  assert.equal(a.eligible, data.filter((p) => p.consent.marketing && p.notifications.promotional && !p.notifications.last_promotional_sent_at).length)
  assert.deepEqual(Object.keys(a).sort(), ['eligible', 'excluded', 'matched'])
})

test('کنترل مجوز مدیران در API و ثبت audit log', async () => {
  const api = createDemoApi(() => NOW, buildDemoProfiles(NOW))
  const id = data.find((p) => p.contact)!.id
  const an = { adminId: 'a', role: 'analyst' as const }, sup = { adminId: 's', role: 'support' as const }, mkt = { adminId: 'm', role: 'marketing' as const }
  assert.ok(!can('analyst', 'users.view_contact') && can('support', 'users.view_contact') && !can('marketing', 'users.view'))
  assert.equal((await api.detail(an, id)).contact, undefined)
  await assert.rejects(api.detail(an, id, { includeContact: true }), /FORBIDDEN/)
  assert.ok((await api.detail(sup, id, { includeContact: true })).contact)
  await assert.rejects(api.list(mkt, {}), /FORBIDDEN/)
  await assert.rejects(api.remove(an, id, id), /FORBIDDEN/)
  await assert.rejects(api.disable(sup, id, 'wrong'), /CONFIRMATION_MISMATCH/)
  await api.disable(sup, id, id)
  assert.equal((await api.detail(an, id)).state, 'disabled')
  assert.ok(api.audit().some((x) => x.action === 'view_contact' && x.admin_id === 's'))
  assert.ok(api.audit().every((x) => !JSON.stringify(x).includes('@')))
  await assert.rejects(api.sendOffer(an, { title: 't', body: 'b', kind: 'promotional', filters: {} }), NotReadyError)
  assert.ok(!can('super_admin', 'audience.send'))
})

test('API واقعی: بدون سرور خطای شفاف می‌دهد و داده ساختگی برنمی‌گرداند', async () => {
  const actor = { adminId: 'a', role: 'analyst' as const }
  const down = createRemoteApi('/api/admin', (async () => { throw new TypeError('offline') }) as typeof fetch)
  await assert.rejects(down.list(actor, {}), ApiUnavailableError)
  const html = createRemoteApi('/api/admin', (async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch)
  await assert.rejects(html.stats(actor), (e: ApiUnavailableError) => e.code === 'BACKEND_NOT_CONNECTED')
  const nf = createRemoteApi('/api/admin', (async () => new Response('', { status: 404 })) as typeof fetch)
  await assert.rejects(nf.stats(actor), ApiUnavailableError)
})
