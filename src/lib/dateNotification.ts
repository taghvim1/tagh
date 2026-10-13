import { tracker } from '../analytics'
import { weatherStore } from '../weather/current/store'
import { dailyPlan, isoDay, notificationTitle, notificationWeather, weatherSignature } from './dateNotificationData'
import { renderWeatherIcon } from './dateNotificationIcon'
import { dateNotificationEnabled, setDateNotificationSetting } from './settings'

// اعلان تاریخ شمسی در نوار اعلان. فقط با کلیک آگاهانهٔ کاربر؛ مجوز مرورگر هرگز در حلقه یا بدون اقدام کاربر درخواست نمی‌شود.
export const DATE_TAG = 'taghvim-date'
const FLAGS = 'taghvim-flags', FLAG_URL = '/__flag/date-notification'
const TITLE = (): { title: string } => (self as unknown as { taghvimDateTitle?: (d?: Date) => { title: string } }).taghvimDateTitle?.() ?? { title: '' }
const PLAN_URL = '/__flag/date-plan'
interface PlanDay { avg: number; wx: string; icon: string | null }

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

const iconCache = new Map<string, string | null>()
async function iconFor(name: Parameters<typeof renderWeatherIcon>[0]) {
  if (!iconCache.has(name)) iconCache.set(name, await renderWeatherIcon(name))
  return iconCache.get(name) ?? null
}

/** طرح ده روز آینده (دما + آیکون هر روز) برای Service Worker: حتی بدون باز شدن برنامه، نیمه‌شب دمای همان روز را می‌گذارد */
async function buildPlan(): Promise<Record<string, PlanDay>> {
  const plan: Record<string, PlanDay> = {}
  for (const { date, weather } of dailyPlan(weatherStore.getState().weather)) plan[date] = { avg: weather.avg, wx: weatherSignature(weather), icon: await iconFor(weather.icon) }
  return plan
}
async function setSwPlan(plan: Record<string, PlanDay> | null) {
  try { const c = await caches.open(FLAGS); if (plan && Object.keys(plan).length) await c.put(PLAN_URL, new Response(JSON.stringify({ days: plan }))); else await c.delete(PLAN_URL) } catch { /* بدون Cache API */ }
}

/** عنوان = «تاریخ شمسی بدون سال   ·   دما °۲۲» و آیکون وکتور آب‌وهوا؛ بدون متن اضافه و بدون دکمه. اگر دادهٔ امروز نبود فقط تاریخ. */
export async function syncDateNotification(): Promise<boolean> {
  if (!dateNotificationEnabled() || notificationState() !== 'granted') return false
  const reg = await registration(); if (!reg) return false
  await ensureTitleScript(); const { title: dateTitle } = TITLE(); if (!dateTitle) return false
  const plan = await buildPlan(); await setSwPlan(plan)
  const today = plan[isoDay(Date.now())]
  const wx = today ? { avg: today.avg, icon: today.icon, sig: today.wx } : (() => { const n = notificationWeather(weatherStore.getState()); return n ? { avg: n.avg, icon: null as string | null, sig: weatherSignature(n) } : null })()
  const title = notificationTitle(dateTitle, wx ? wx.avg : null), sig = wx ? wx.sig : ''
  try {
    const shown = await reg.getNotifications({ tag: DATE_TAG })
    if (shown.some((n) => n.title === title && ((n.data as { wx?: string } | null)?.wx ?? '') === sig)) return true // بدون تغییر: دوباره نشان نده
    await reg.showNotification(title, { tag: DATE_TAG, renotify: false, silent: true, requireInteraction: true, badge: '/icons/icon-192.png', ...(wx?.icon ? { icon: wx.icon } : {}), data: { url: '/', wx: sig } } as NotificationOptions)
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
  setDateNotificationSetting(false); await setSwFlag(false); await setSwPlan(null)
  const reg = await registration()
  try { (await reg?.getNotifications({ tag: DATE_TAG }))?.forEach((n) => n.close()) } catch { /* ignore */ }
  await registerPeriodic(reg, false)
}

/** هنگام باز شدن برنامه، بازگشت به برنامه و نیمه‌شب: تاریخ نمایش‌داده‌شده را در صورت تغییر به‌روز می‌کند (بدون درخواست مجوز) */
export function startDateNotificationSync() {
  if (!dateNotificationEnabled()) { /* ممکن است بعداً روشن شود؛ شنونده‌ها ارزان‌اند */ }
  const go = () => { void syncDateNotification() }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go() })
  weatherStore.subscribe(go) // با به‌روزشدن آب‌وهوا، اعلان هم به‌روز می‌شود
  const schedule = () => { const n = new Date(); const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5); window.setTimeout(() => { go(); schedule() }, next.getTime() - n.getTime()) }
  schedule(); go()
}
