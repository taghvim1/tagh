import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './fonts.css'
import './styles.css'
import './components/calendar.css'
import { initCalendarData } from './lib/calendarData'
import { addNotification } from './lib/notifications'
import { startAutoFlush, tracker } from './analytics'
import { startDateNotificationSync } from './lib/dateNotification'
import { startPermissionSync } from './lib/permissionSync'
import { initHistory } from './lib/router'
import { initHistoricalClimate } from './weather/history/store'

tracker.track('app_open') // روی پنل مدیریت/دستگاه آزمایشی/ربات خودبه‌خود ثبت نمی‌شود (skipTelemetry)
// باز شدن از روی اعلان تبلیغاتی (آدرس ?from=push): «بازکردن اعلان» شمرده می‌شود و پارامتر از آدرس برداشته می‌شود
try {
  const u = new URL(location.href)
  if (u.searchParams.get('from') === 'push') { tracker.track('notification_open'); u.searchParams.delete('from'); history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash) }
} catch { /* آدرس نامعتبر */ }
startAutoFlush()
startPermissionSync()
startDateNotificationSync()
initHistory() // Back هرگز از صفحهٔ داخلی مستقیم از برنامه خارج نمی‌شود
void initHistoricalClimate() // آمار تاریخی آب‌وهوای مقصدها: از حافظه می‌آید و فقط موارد جدید/قدیمی دوباره دریافت می‌شوند
void initCalendarData() // نمایش فوری داده‌های محلی؛ نسخهٔ جدید در پس‌زمینه

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

function registerServiceWorker() {
  navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      // نسخهٔ جدید برنامه در پس‌زمینه دریافت می‌شود و با اجرای بعدی استفاده می‌شود
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            addNotification({ title: 'نسخهٔ جدید برنامه دریافت شد', text: 'با باز کردن دوبارهٔ برنامه، نسخهٔ جدید استفاده می‌شود.' })
          }
        })
      })
      const check = () => { if (navigator.onLine) reg.update().catch(() => undefined) }
      check()
      window.addEventListener('online', check)
    })
    .catch(console.error)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', registerServiceWorker)
}
