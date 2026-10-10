// Offline-First: پوستهٔ برنامه و همهٔ فایل‌های ساخت در نصب Precache می‌شوند و همیشه فوراً از کش سرو می‌شوند.
// نسخهٔ جدید در پس‌زمینه دریافت می‌شود (به‌روزرسانی sw.js)؛ داده‌های /data/ اول از شبکه و در نبود اینترنت از کش می‌آیند.
// این دو مقدار هنگام build توسط scripts/precache-plugin.mjs پر می‌شوند.
const BUILD = '__BUILD__'
const PRECACHE = [/*PRECACHE*/]
const PREFIX = 'taghvim-'
const CACHE = PREFIX + BUILD

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      // نسخهٔ فعلی و یکی قبل از آن می‌مانند تا صفحهٔ باز با فایل‌های قدیمی (مثلاً Chunk تنبل) خراب نشود
      const mine = keys.filter((k) => k.startsWith(PREFIX)).sort().reverse()
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
