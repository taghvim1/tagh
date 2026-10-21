// Offline-First: پوستهٔ برنامه و همهٔ فایل‌های ساخت در نصب Precache می‌شوند و همیشه فوراً از کش سرو می‌شوند.
// نسخهٔ جدید در پس‌زمینه دریافت می‌شود (به‌روزرسانی sw.js)؛ داده‌های /data/ اول از شبکه و در نبود اینترنت از کش می‌آیند.
// این دو مقدار هنگام build توسط scripts/precache-plugin.mjs پر می‌شوند.
const BUILD = '__BUILD__'
const PRECACHE = [/*PRECACHE*/]
const PREFIX = 'taghvim-'
const CACHE = PREFIX + BUILD
const FLAGS = PREFIX + 'flags' // پرچم‌های کوچک برای SW (مثلاً روشن‌بودن اعلان تاریخ)؛ با نسخهٔ build پاک نمی‌شود
const IMGS = PREFIX + 'feed-images' // تصویر کاشی‌های «آیا می‌دانستید» (دامنهٔ بیرونی)؛ با نسخهٔ build پاک نمی‌شود تا آفلاین هم دیده شوند
const MAX_IMGS = 60
const DATE_FLAG = '/__flag/date-notification'
const DATE_TAG = 'taghvim-date'
importScripts('/date-title.js')

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      // نسخهٔ فعلی و یکی قبل از آن می‌مانند تا صفحهٔ باز با فایل‌های قدیمی (مثلاً Chunk تنبل) خراب نشود
      const mine = keys.filter((k) => k.startsWith(PREFIX) && k !== FLAGS && k !== IMGS).sort().reverse()
      return Promise.all(mine.slice(2).concat(keys.filter((k) => !k.startsWith(PREFIX))).map((k) => caches.delete(k)))
    }).then(() => self.clients.claim())
  )
})

const put = (req, res) => caches.open(CACHE).then((c) => c.put(req, res))

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET') return
  // تصویرهای بیرونی (کاشی‌های صفحهٔ اصلی): اول کش؛ اگر نبود شبکه و ذخیره. پاسخ opaque هم ذخیره می‌شود. در نبود اینترنت بدون خطا (برنامه جایگزین رنگی نشان می‌دهد)
  if (url.origin !== location.origin) {
    if (req.destination !== 'image' || !/^https?:$/.test(url.protocol)) return
    e.respondWith(caches.open(IMGS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { c.put(req, res.clone()).then(() => c.keys()).then((ks) => Promise.all(ks.slice(0, Math.max(0, ks.length - MAX_IMGS)).map((k) => c.delete(k)))).catch(() => {}) }
      return res
    }))))
    return
  }
  // API (اطلاعات شخصی/مدیریتی): هرگز از کش عمومی سرو یا در آن ذخیره نمی‌شود؛ مستقیم به شبکه می‌رود
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return

  // داده‌های تقویم: اول شبکه (برای نسخهٔ جدید)، در نبود اینترنت آخرین نسخهٔ ذخیره‌شده
  if (url.pathname.startsWith('/data/')) {
    e.respondWith(
      fetch(req).then((res) => { if (res.ok) put(req, res.clone()); return res }).catch(() => caches.match(req))
    )
    return
  }

  // ناوبری: بلافاصله پوستهٔ برنامه از کش (بدون انتظار برای شبکه)
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then((c) => c.match('/')).then((hit) => hit || fetch(req)))
    return
  }

  // فایل‌ها: اول کش، بعد شبکه (و ذخیره)
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) put(req, res.clone()); return res }))
  )
})

// ---- اعلان تاریخ ----
// فقط وقتی کاربر خودش از «تنظیمات» روشن کرده و مجوز اعلان داده باشد. وب‌اپ نمی‌تواند اعلان «غیرقابل‌حذف» بسازد؛ کاربر می‌تواند آن را کنار بزند.
// به‌روزرسانی در پس‌زمینه (periodicsync) به‌صورت بهترین‌تلاش و وابسته به مرورگر است.
async function showDateNotification(force) {
  const cache = await caches.open(FLAGS)
  if (!(await cache.match(DATE_FLAG)) || (self.Notification && Notification.permission !== 'granted')) return
  const now = new Date()
  const pad = (n) => (n < 10 ? '0' : '') + n
  const key = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
  // طرح ساعتی را برنامه می‌سازد (دمای هر ساعت + آیکون)؛ اگر ردیف «امروز» نبود فقط تاریخ نمایش داده می‌شود (دادهٔ کهنه یا ساختگی نه)
  let day = null
  try { const r = await cache.match('/__flag/date-plan'); const v = r && (await r.json()); day = (v && v.days && v.days[key] && v.days[key][pad(now.getHours())]) || null } catch (e) { /* فقط تاریخ */ }
  const d = self.taghvimDateTitle(now)
  const title = self.taghvimNotifTitle(now, day ? day.t : null), sig = day ? day.wx : ''
  const shown = await self.registration.getNotifications({ tag: DATE_TAG })
  if (!force && shown.some((n) => n.title === title && ((n.data && n.data.wx) || '') === sig)) return // بدون تغییر (در بسته‌شدن اعلان اجباری است: ممکن است هنوز در فهرست باشد)
  await self.registration.showNotification(title, ({ tag: DATE_TAG, renotify: false, silent: true, requireInteraction: true, badge: '/icons/day/' + d.day + '.png', icon: '/icons/daybig/' + d.day + '.png', data: { url: '/', wx: sig } }))
}
self.addEventListener('periodicsync', (e) => { if (e.tag === DATE_TAG) e.waitUntil(showDateNotification()) })
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'sync-date-notification') e.waitUntil(showDateNotification()) })
// کاربر اعلان را کنار زد یا «Clear all» زد: تا وقتی گزینه روشن است همان لحظه دوباره گذاشته می‌شود (مرورگر اعلان «دائمی» اجازه نمی‌دهد)
self.addEventListener('notificationclose', (e) => { if (e.notification.tag === DATE_TAG) e.waitUntil(showDateNotification(true)) })
self.addEventListener('notificationclick', (e) => {
  const url = (e.notification.data && e.notification.data.url) || '/'
  if (e.notification.tag !== DATE_TAG) e.notification.close() // اعلان تاریخ با کلیک بسته نمی‌شود
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => (list.length ? list[0].focus().then((c) => { if (c && c.navigate && url !== '/') return c.navigate(url) }) : self.clients.openWindow(url))))
})

// Web Push (مثلاً آماده‌شدن پکیج تور وقتی برنامه بسته است)
self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { /* بدون محتوا */ }
  e.waitUntil(self.registration.showNotification(d.title || 'تقویم سفر', { body: d.body || '', tag: d.tag || 'taghvim-push', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', dir: 'rtl', lang: 'fa', data: { url: d.url || '/' } }))
})
