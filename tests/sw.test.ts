import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'

// شبیه‌ساز Service Worker: public/sw.js را با Cache API و fetch ساختگی اجرا می‌کند تا رفتار آفلاین و اعلان تاریخ بدون مرورگر تست شود.
const SW = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')
const TITLE_JS = readFileSync(join(process.cwd(), 'public/date-title.js'), 'utf8')
const PRECACHE = ['/', '/assets/app.js', '/assets/app.css', '/date-title.js', '/icons/icon-192.png']

class MemCache {
  map = new Map<string, Response>()
  key = (r: RequestInfo | URL) => { const u = new URL(typeof r === 'string' ? r : r instanceof URL ? r.href : (r as Request).url, 'https://t.test'); return u.pathname + u.search }
  async match(r: RequestInfo | URL) { const h = this.map.get(this.key(r)); return h ? h.clone() : undefined }
  async put(r: RequestInfo | URL, res: Response) { this.map.set(this.key(r), res) }
  async delete(r: RequestInfo | URL) { return this.map.delete(this.key(r)) }
  async keys() { return [...this.map.keys()].map((k) => new Request('https://t.test' + k)) }
}
function boot(opts: { permission?: string; build?: string } = {}) {
  const stores = new Map<string, MemCache>(), handlers: Record<string, ((e: any) => void)[]> = {}
  const net = { online: true, calls: [] as string[], fail: new Set<string>() }
  const shown: { title: string; opts: any }[] = []
  const caches = {
    open: async (n: string) => { if (!stores.has(n)) stores.set(n, new MemCache()); return stores.get(n)! },
    keys: async () => [...stores.keys()], delete: async (n: string) => stores.delete(n),
    match: async (r: RequestInfo | URL) => { for (const c of stores.values()) { const h = await c.match(r); if (h) return h } return undefined },
  }
  const cacheOpenAddAll = async (name: string, urls: string[]) => { const c = await caches.open(name); for (const u of urls) c.put(u, await fetchMock(u)) }
  const fetchMock = async (r: RequestInfo | URL) => { const u = typeof r === 'string' ? r : r instanceof URL ? r.href : (r as Request).url; net.calls.push(u); if (!net.online) throw new TypeError('offline'); if ([...net.fail].some((f) => u.endsWith(f))) return new Response('err', { status: 500 }); return new Response('net:' + u.replace('https://t.test', ''), { status: 200 }) }
  const origOpen = caches.open
  caches.open = async (n: string) => { const c = await origOpen(n); (c as any).addAll = async (urls: string[]) => { for (const u of urls) c.put(u, await fetchMock(u)) }; return c }
  const reg = {
    showNotification: async (title: string, o: any) => { const i = shown.findIndex((s) => s.opts.tag === o.tag); const rec = { title, opts: o }; i >= 0 ? (shown[i] = rec) : shown.push(rec) },
    getNotifications: async ({ tag }: { tag?: string } = {}) => shown.filter((s) => !tag || s.opts.tag === tag).map((s) => ({ title: s.title, tag: s.opts.tag, data: s.opts.data, close: () => { const i = shown.indexOf(s); if (i >= 0) shown.splice(i, 1) } })),
  }
  const opened: string[] = []
  const self: any = {
    addEventListener: (t: string, f: (e: any) => void) => { (handlers[t] ??= []).push(f) },
    skipWaiting: async () => undefined, registration: reg, location: new URL('https://t.test/'),
    clients: { claim: async () => undefined, matchAll: async () => [], openWindow: async (u: string) => { opened.push(u) } },
    Notification: { permission: opts.permission ?? 'granted' }, caches,
  }
  class SwRequest extends Request { constructor(u: string | Request, i?: RequestInit) { super(typeof u === 'string' ? new URL(u, 'https://t.test').href : u, i) } } // در مرورگر آدرس نسبی مجاز است
  const ctx = vm.createContext({ self, caches, fetch: fetchMock, Response, Request: SwRequest, URL, location: self.location, console, Date, JSON, Promise, importScripts: () => vm.runInContext(TITLE_JS, ctx), Notification: self.Notification })
  vm.runInContext(SW.replace('__BUILD__', opts.build ?? 'b1').replace('[/*PRECACHE*/]', JSON.stringify(PRECACHE)), ctx)
  const fire = async (type: string, e: Record<string, unknown> = {}) => { const waits: Promise<unknown>[] = []; let response: Promise<Response> | undefined; const ev = { ...e, waitUntil: (p: Promise<unknown>) => waits.push(p), respondWith: (p: Promise<Response>) => { response = p } }; for (const h of handlers[type] ?? []) h(ev); await Promise.all(waits); return response }
  const req = (url: string, mode = 'cors', destination = '') => ({ url: 'https://t.test' + url, method: 'GET', mode, destination })
  return { fire, net, shown, stores, req, opened, caches, reg, install: async () => { await fire('install'); await fire('activate') } }
}

test('آفلاین: صفحهٔ اصلی و فایل‌های برنامه از کش می‌آیند', async () => {
  const sw = boot(); await sw.install(); sw.net.online = false
  for (const [path, mode] of [['/', 'navigate'], ['/privacy', 'navigate'], ['/tours?x=1', 'navigate'], ['/assets/app.js', 'cors'], ['/icons/icon-192.png', 'no-cors']] as const) {
    const r = await sw.fire('fetch', { request: sw.req(path, mode) }); assert.ok(r, path); assert.equal(await (await r!).text(), 'net:/' + (path === '/' || mode === 'navigate' ? '' : path.slice(1)), path)
  }
})
test('آفلاین: درخواست‌های /api به کش نمی‌روند (مستقیم شبکه)', async () => {
  const sw = boot(); await sw.install(); sw.net.online = false
  assert.equal(await sw.fire('fetch', { request: sw.req('/api/events') }), undefined)
})
const text = async (sw: ReturnType<typeof boot>, path: string, mode = 'cors') => { const r = await sw.fire('fetch', { request: sw.req(path, mode) }); return r ? await (await r).text() : undefined }
test('/data/: اول شبکه؛ آفلاین از آخرین نسخهٔ ذخیره‌شده، حتی بعد از چند نسخهٔ جدید برنامه', async () => {
  let sw = boot({ build: 'b1' }); await sw.install()
  assert.equal(await text(sw, '/data/calendar-data.json'), 'net:/data/calendar-data.json') // آنلاین: ذخیره می‌شود
  sw.net.online = false
  assert.equal(await text(sw, '/data/calendar-data.json'), 'net:/data/calendar-data.json')
  // سه استقرار پشت‌سرهم: هر کدام کش نسخهٔ خودش را می‌سازد و فقط دو نسخهٔ آخر می‌ماند
  for (const b of ['b2', 'b3', 'b4']) { const n = boot({ build: b }); for (const [k, v] of sw.stores) n.stores.set(k, v); n.net.online = true; await n.install(); sw = n }
  sw.net.online = false
  assert.equal(await text(sw, '/data/calendar-data.json'), 'net:/data/calendar-data.json') // آفلاین هنوز باید داده را داشته باشد
})

test('نصب مقاوم: خطای یک فایل جانبی (آیکون) نصب را خراب نمی‌کند؛ ولی خطای پوسته (صفحهٔ اصلی/JS) نصب را رد می‌کند', async () => {
  const ok = boot(); ok.net.fail.add('/icons/icon-192.png'); await ok.install(); ok.net.online = false
  assert.equal(await text(ok, '/', 'navigate'), 'net:/') // پوسته آفلاین سرو می‌شود
  assert.equal(await text(ok, '/assets/app.js'), 'net:/assets/app.js')
  const bad = boot(); bad.net.fail.add('/assets/app.js')
  await assert.rejects(bad.fire('install'))
})
test('نصب ناقص یا کش خالی: آفلاین پیام ساده می‌دهد نه صفحهٔ خطای مرورگر؛ و پوستهٔ نسخهٔ قبل را ترجیح می‌دهد', async () => {
  const empty = boot(); empty.net.online = false
  const r = await empty.fire('fetch', { request: empty.req('/', 'navigate') }); const res = await r!
  assert.equal(res.status, 503); assert.match(await res.text(), /اینترنت/)
  const old = boot({ build: 'old' }); await old.install()
  const nw = boot({ build: 'new' }); for (const [k, v] of old.stores) nw.stores.set(k, v); nw.net.online = false // نسخهٔ جدید هنوز نصب نشده
  assert.equal(await text(nw, '/privacy', 'navigate'), 'net:/')
})

// ---- اعلان تاریخ ----
const enable = async (sw: ReturnType<typeof boot>) => { await (await sw.caches.open('taghvim-flags')).put('/__flag/date-notification', new Response('1')) }
const dateShown = (sw: ReturnType<typeof boot>) => sw.shown.filter((s) => s.opts.tag === 'taghvim-date')
test('اعلان تاریخ: با پرچم روشن گذاشته می‌شود و ماندگار است (requireInteraction)؛ بدون پرچم یا مجوز هیچ‌چیز', async () => {
  const off = boot(); await off.install(); await off.fire('message', { data: { type: 'sync-date-notification' } }); assert.equal(off.shown.length, 0)
  const noPerm = boot({ permission: 'denied' }); await enable(noPerm); await noPerm.install(); await noPerm.fire('message', { data: { type: 'sync-date-notification' } }); assert.equal(noPerm.shown.length, 0)
  const sw = boot(); await enable(sw); await sw.install()
  assert.equal(dateShown(sw).length, 1) // فعال‌شدن SW هم آن را می‌گذارد
  assert.equal(dateShown(sw)[0].opts.requireInteraction, true)
})
test('اعلان تاریخ: بعد از «لمس» دوباره گذاشته می‌شود (مرورگر با لمس آن را برمی‌دارد و close نمی‌فرستد)', async () => {
  const sw = boot(); await enable(sw); await sw.install()
  sw.shown.length = 0 // لمس: مرورگر اعلان را برداشت
  await sw.fire('notificationclick', { notification: { tag: 'taghvim-date', data: { url: '/' }, close: () => { throw new Error('اعلان تاریخ نباید با کد بسته شود') } } })
  assert.equal(dateShown(sw).length, 1)
})
test('اعلان تاریخ: بعد از کنار زدن (close) و Clear all دوباره گذاشته می‌شود؛ اعلان‌های دیگر بسته می‌مانند', async () => {
  const sw = boot(); await enable(sw); await sw.install()
  sw.shown.length = 0
  await sw.fire('notificationclose', { notification: { tag: 'taghvim-date' } }); assert.equal(dateShown(sw).length, 1)
  sw.shown.length = 0
  await sw.fire('notificationclose', { notification: { tag: 'taghvim-promo' } }); assert.equal(sw.shown.length, 0)
  let closed = false
  await sw.fire('notificationclick', { notification: { tag: 'taghvim-promo', data: { url: '/tours' }, close: () => { closed = true } } }); assert.equal(closed, true); assert.equal(dateShown(sw).length, 0)
})
test('اعلان تاریخ: با رسیدن Push، اگر از نوار رفته بود برمی‌گردد؛ اگر بود تکرار نمی‌شود', async () => {
  const sw = boot(); await enable(sw); await sw.install(); sw.shown.length = 0
  await sw.fire('push', { data: { json: () => ({ title: 'پیشنهاد', body: 'متن', url: '/tours', tag: 'taghvim-promo' }) } })
  assert.equal(dateShown(sw).length, 1); assert.equal(sw.shown.filter((s) => s.opts.tag === 'taghvim-promo').length, 1)
  const before = dateShown(sw)[0]; await sw.fire('push', { data: { json: () => ({ title: 'دوباره' }) } }); assert.equal(dateShown(sw)[0], before) // بدون تغییر: دوباره نشان داده نمی‌شود
})
