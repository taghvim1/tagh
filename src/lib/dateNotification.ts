import { tracker } from '../analytics'
import { dateNotificationEnabled, setDateNotificationSetting } from './settings'

// اعلان تاریخ شمسی در نوار اعلان. فقط با کلیک آگاهانهٔ کاربر؛ مجوز مرورگر هرگز در حلقه یا بدون اقدام کاربر درخواست نمی‌شود.
export const DATE_TAG = 'taghvim-date'
const FLAGS = 'taghvim-flags', FLAG_URL = '/__flag/date-notification'
const TITLE = (): { title: string } => (self as unknown as { taghvimDateTitle?: (d?: Date) => { title: string } }).taghvimDateTitle?.() ?? { title: '' }

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'insecure' | 'dismissed'
export const notificationState = (): 'granted' | 'denied' | 'default' | 'unsupported' => (typeof Notification === 'undefined' || !('serviceWorker' in navigator) ? 'unsupported' : Notification.permission)

async function setSwFlag(on: boolean) {
  try { const c = await caches.open(FLAGS); if (on) await c.put(FLAG_URL, new Response('1')); else await c.delete(FLAG_URL) } catch { /* بدون Cache API */ }
}
async function registration() { try { return await navigator.serviceWorker.ready } catch { return null } }

/** عنوان از همان تابع مشترک SW (public/date-title.js) خوانده می‌شود تا دقیقاً با تقویم یکی باشد */
async function ensureTitleScript() {
  if (TITLE().title) return
  await new Promise<void>((res) => { const s = document.createElement('script'); s.src = '/date-title.js'; s.onload = () => res(); s.onerror = () => res(); document.head.appendChild(s) })
}

export async function syncDateNotification(): Promise<boolean> {
  if (!dateNotificationEnabled() || notificationState() !== 'granted') return false
  const reg = await registration(); if (!reg) return false
  await ensureTitleScript(); const { title } = TITLE(); if (!title) return false
  try {
    if ((await reg.getNotifications({ tag: DATE_TAG })).some((n) => n.title === title)) return true // تکراری نشان نده
    await reg.showNotification(title, { body: 'تقویم سفر', tag: DATE_TAG, renotify: false, silent: true, requireInteraction: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: '/' } } as NotificationOptions)
    return true
  } catch { return false }
}

async function registerPeriodic(reg: ServiceWorkerRegistration | null, on: boolean) {
  const ps = (reg as unknown as { periodicSync?: { register(t: string, o: { minInterval: number }): Promise<void>; unregister(t: string): Promise<void> } } | null)?.periodicSync
  if (!ps) return
  try { on ? await ps.register(DATE_TAG, { minInterval: 12 * 3600_000 }) : await ps.unregister(DATE_TAG) } catch { /* مرورگر اجازه نداد؛ فقط وقتی برنامه باز می‌شود به‌روز می‌شود */ }
}

/** فقط از داخل کلیک کاربر صدا زده شود */
export async function enableDateNotification(): Promise<EnableResult> {
  if (!window.isSecureContext) return 'insecure'
  const st = notificationState()
  if (st === 'unsupported') return 'unsupported'
  if (st === 'denied') return 'denied'
  if (st === 'default') { const p = await Notification.requestPermission(); if (p === 'denied') return 'denied'; if (p !== 'granted') return 'dismissed' }
  setDateNotificationSetting(true); tracker.setConsent('notifications', true, 'settings')
  await setSwFlag(true)
  const ok = await syncDateNotification()
  await registerPeriodic(await registration(), true)
  return ok ? 'ok' : 'unsupported'
}

export async function disableDateNotification() {
  setDateNotificationSetting(false); await setSwFlag(false)
  const reg = await registration()
  try { (await reg?.getNotifications({ tag: DATE_TAG }))?.forEach((n) => n.close()) } catch { /* ignore */ }
  await registerPeriodic(reg, false)
}

/** هنگام باز شدن برنامه، بازگشت به برنامه و نیمه‌شب: تاریخ نمایش‌داده‌شده را در صورت تغییر به‌روز می‌کند (بدون درخواست مجوز) */
export function startDateNotificationSync() {
  if (!dateNotificationEnabled()) { /* ممکن است بعداً روشن شود؛ شنونده‌ها ارزان‌اند */ }
  const go = () => { void syncDateNotification() }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go() })
  const schedule = () => { const n = new Date(); const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5); window.setTimeout(() => { go(); schedule() }, next.getTime() - n.getTime()) }
  schedule(); go()
}
