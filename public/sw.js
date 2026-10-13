// Offline-First: پوستهٔ برنامه و همهٔ فایل‌های ساخت در نصب Precache می‌شوند و همیشه فوراً از کش سرو می‌شوند.
// نسخهٔ جدید در پس‌زمینه دریافت می‌شود (به‌روزرسانی sw.js)؛ داده‌های /data/ اول از شبکه و در نبود اینترنت از کش می‌آیند.
// این دو مقدار هنگام build توسط scripts/precache-plugin.mjs پر می‌شوند.
const BUILD = '__BUILD__'
const PRECACHE = [/*PRECACHE*/]
const PREFIX = 'taghvim-'
const CACHE = PREFIX + BUILD
const FLAGS = PREFIX + 'flags' // پرچم‌های کوچک برای SW (مثلاً روشن‌بودن اعلان تاریخ)؛ با نسخهٔ build پاک نمی‌شود
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
      const mine = keys.filter((k) => k.startsWith(PREFIX) && k !== FLAGS).sort().reverse()
      return Promise.all(mine.slice(2).concat(keys.filter((k) => !k.startsWith(PREFIX))).map((k) => caches.delete(k)))
    }).then(() => self.clients.claim())
  )
})

const put = (req, res) => caches.open(CACHE).then((c) => c.put(req, res))

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
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
async function showDateNotification() {
  const flag = await caches.open(FLAGS).then((c) => c.match(DATE_FLAG))
  if (!flag || (self.Notification && Notification.permission !== 'granted')) return
  const d = self.taghvimDateTitle(new Date())
  const shown = await self.registration.getNotifications({ tag: DATE_TAG })
  if (shown.some((n) => n.title === d.title)) return // همان تاریخ قبلاً نمایش داده شده؛ دوباره صدا/هشدار نده
  await self.registration.showNotification(d.title, {
    body: 'تقویم سفر', tag: DATE_TAG, renotify: false, silent: true, requireInteraction: true,
    icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: '/' },
  })
}
self.addEventListener('periodicsync', (e) => { if (e.tag === DATE_TAG) e.waitUntil(showDateNotification()) })
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'sync-date-notification') e.waitUntil(showDateNotification()) })
self.addEventListener('notificationclick', (e) => {
  const url = (e.notification.data && e.notification.data.url) || '/'
  if (e.notification.tag !== DATE_TAG) e.notification.close() // اعلان تاریخ با کلیک بسته نمی‌شود
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => (list.length ? list[0].focus() : self.clients.openWindow(url))))
})
