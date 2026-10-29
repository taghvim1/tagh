import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { memoryKV } from '../src/analytics/ids'
import { createTracker } from '../src/analytics/tracker'
import { registerInstallation } from '../src/auth/client'
import { setInternalDevice, skipTelemetry } from '../src/lib/internal'

// محیط ساختگی مرورگر: localStorage، آدرس و userAgent قابل‌تنظیم
const g = globalThis as Record<string, unknown>
const saved = { ls: g.localStorage, loc: Object.getOwnPropertyDescriptor(g, 'location'), nav: Object.getOwnPropertyDescriptor(g, 'navigator') }
const set = (k: string, v: unknown) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true })
function env(o: { host?: string; path?: string; ua?: string; webdriver?: boolean } = {}) {
  const kv = memoryKV()
  set('localStorage', kv); set('location', { hostname: o.host ?? 'taghvim.example.com', pathname: o.path ?? '/' })
  set('navigator', { userAgent: o.ua ?? 'Mozilla/5.0 (iPhone) Safari/605', webdriver: o.webdriver ?? false })
  return kv
}
beforeEach(() => env())
afterEach(() => { set('localStorage', saved.ls); saved.loc ? Object.defineProperty(g, 'location', saved.loc) : delete g.location; saved.nav ? Object.defineProperty(g, 'navigator', saved.nav) : delete g.navigator })

const fakeFetch = () => { const calls: { url: string; body: Record<string, unknown> }[] = []; return { calls, f: (async (url: string, init?: RequestInit) => { calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) }); return new Response(null, { status: 204 }) }) as typeof fetch } }

test('نصب عادی ثبت می‌شود و شناسهٔ ردیاب هم همراهش می‌رود؛ بازشدن پشت‌سرهم دوباره نمی‌فرستد', async () => {
  const n = fakeFetch()
  assert.equal(await registerInstallation(n.f), true)
  assert.equal(n.calls.length, 1); assert.equal(n.calls[0].url, '/api/installations')
  assert.match(String(n.calls[0].body.installation_id), /.{8,}/); assert.match(String(n.calls[0].body.analytics_id), /^anon_/)
  assert.equal(await registerInstallation(n.f), true); assert.equal(n.calls.length, 1) // کمتر از ۳۰ دقیقه
})

test('ثبت نمی‌شود: پنل مدیریت، ربات/خزنده، webdriver، localhost و دستگاه علامت‌خورده', async () => {
  for (const [name, o] of [['admin', { path: '/admin/users' }], ['googlebot', { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }], ['lighthouse', { ua: 'Chrome-Lighthouse' }], ['webdriver', { webdriver: true }], ['localhost', { host: 'localhost' }], ['127', { host: '127.0.0.1' }]] as const) {
    env(o); const n = fakeFetch()
    assert.equal(await registerInstallation(n.f), false, name); assert.equal(n.calls.length, 0, name)
  }
  const kv = env(); setInternalDevice(true); assert.equal(kv.getItem('tp-internal'), '1')
  const n = fakeFetch(); assert.equal(await registerInstallation(n.f), false); assert.equal(n.calls.length, 0)
})

test('پرچم «عادی» روی localhost ثبت را دوباره فعال می‌کند؛ بازگشت به پیش‌فرض', async () => {
  env({ host: 'localhost' }); assert.equal(skipTelemetry(), true)
  setInternalDevice(false); assert.equal(skipTelemetry(), false)
  const n = fakeFetch(); assert.equal(await registerInstallation(n.f), true); assert.equal(n.calls.length, 1)
  setInternalDevice(null); assert.equal(skipTelemetry(), true)
})

test('ردیاب روی دستگاه آزمایشی چیزی ثبت یا ارسال نمی‌کند', async () => {
  const kv = memoryKV(); let off = true
  const sent: number[] = []
  const tr = createTracker({ kv, isDisabled: () => off, transport: { send: async (e) => { sent.push(e.length) } } })
  assert.equal(tr.track('app_open'), null); assert.equal(tr.pending(), 0)
  assert.equal((await tr.flush()).status, 'skipped'); assert.deepEqual(sent, [])
  off = false; assert.ok(tr.track('app_open'))
})

test('بعد از «حذف داده‌ها» شناسهٔ نصب و زمان ثبت هم پاک می‌شوند (نصب تازه به ردیف قبلی وصل نشود)', () => {
  const kv = memoryKV(); kv.setItem('tp-install-id', 'inst-old-123456'); kv.setItem('tp-install-ping', '1|anon_x')
  const tr = createTracker({ kv }); tr.deleteMyData()
  assert.equal(kv.getItem('tp-install-id'), null); assert.equal(kv.getItem('tp-install-ping'), null)
})
