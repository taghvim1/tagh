import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './fonts.css'
import './styles.css'
import './components/calendar.css'
import { initCalendarData } from './lib/calendarData'
import { addNotification } from './lib/notifications'
import { initHistory } from './lib/router'
import { initHistoricalClimate } from './weather/history/store'

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
