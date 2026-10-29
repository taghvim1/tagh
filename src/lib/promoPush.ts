import { tracker } from '../analytics'
import { registerInstallation, getInstallId } from '../auth/client'
import { skipTelemetry } from './internal'

// اشتراک Push برای پیشنهادهای تبلیغاتی. فقط وقتی به سرور اعلام می‌شود که هر سه شرط برقرار باشد:
// مجوز اعلان مرورگر داده شده، رضایت تبلیغاتی روشن است و دستگاه ربات/آزمایشی نیست. با لغو رضایت یا برداشتن مجوز، اشتراک از سرور حذف می‌شود.
// (اشتراک خودِ مرورگر دست نمی‌خورد؛ اعلان آماده‌شدن پکیج تور از همان استفاده می‌کند.)
const STATE_KEY = 'tp-promo-sub' // «شناسهٔ نصب|آدرس اشتراک» آخرین اشتراکِ اعلام‌شده به سرور
const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)) }
const getState = () => { try { return localStorage.getItem(STATE_KEY) } catch { return null } }
const setState = (v: string | null) => { try { v ? localStorage.setItem(STATE_KEY, v) : localStorage.removeItem(STATE_KEY) } catch { /* فقط حافظه */ } }
const post = async (path: string, body: unknown) => { try { return (await fetch(`/api${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).status } catch { return 0 } }

// tracker.subscribe با هر رویداد صدا زده می‌شود: فقط وقتی «شرایط» عوض شده یا آخرین تلاش ناموفق و >۶۰ ثانیه قدیمی است کار می‌کنیم
let lastKey = '', lastTry = 0
const RETRY_MS = 60_000

export async function syncPromoPush(): Promise<'subscribed' | 'unsubscribed' | 'skipped'> {
  try {
    const id = getInstallId()
    if (!id || typeof Notification === 'undefined') return 'skipped'
    const c = tracker.consent()
    const want = c.notifications && c.marketing && Notification.permission === 'granted' && !skipTelemetry()
    const key = `${id}|${want}`, t = Date.now()
    if (key === lastKey && want && getState()?.startsWith(id + '|')) return 'subscribed' // قبلاً اعلام شده؛ نیازی به شبکه نیست
    if (key === lastKey && t - lastTry < RETRY_MS) return 'skipped'
    if (key === lastKey && !want && !getState()) return 'skipped' // خاموش و چیزی برای لغو نیست
    lastKey = key; lastTry = t
    if (!want) {
      if (getState() && (await post('/push/unsubscribe', { installation_id: id })) === 204) { setState(null); return 'unsubscribed' }
      return 'skipped'
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'skipped'
    const o = await (await fetch('/api/package/options')).json() as { push_key?: string }
    if (!o.push_key) return 'skipped'
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(o.push_key) })
    const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!j.endpoint || !j.keys?.p256dh || !j.keys.auth) return 'skipped'
    const sig = `${id}|${j.endpoint}`
    if (getState() === sig) return 'subscribed' // قبلاً اعلام شده
    await registerInstallation() // ردیف کاربر باید در سرور وجود داشته باشد
    const st = await post('/push/subscribe', { installation_id: id, subscription: { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } } })
    if (st === 204) { setState(sig); return 'subscribed' }
    return 'skipped'
  } catch { return 'skipped' }
}
