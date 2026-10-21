import type { PackageInput, TourPackage } from './types'

export const BUDGETS = ['اقتصادی', 'متوسط', 'لوکس']
export const VEHICLES = ['خودروی شخصی', 'اتوبوس', 'قطار', 'هواپیما', 'کشتی یا لنج']
/** همان «نوع مقصد» بخش پیشنهادهای سفر */
export const TRIP_TYPES = ['طبیعت', 'جنگل', 'ساحل', 'کویر', 'کوهستان', 'تاریخی', 'فرهنگی', 'ماجراجویی', 'شهری']

export interface PushSubJSON { endpoint: string; keys: { p256dh: string; auth: string } }
export type StartOutcome = { ok: true; jobId: string } | { ok: false; error: 'invalid' | 'busy' | 'unavailable' | 'network'; message: string }
export type JobState = { status: 'pending' } | { status: 'done'; package: TourPackage } | { status: 'failed'; error: string } | { status: 'gone' } | { status: 'offline' }

const json = async (res: Response) => ((res.headers.get('content-type') ?? '').includes('json') ? ((await res.json()) as Record<string, unknown>) : null)

/** شروع طراحی در پس‌زمینهٔ سرور؛ فوراً شناسهٔ کار برمی‌گردد. */
export async function startPackage(input: PackageInput, push?: PushSubJSON | null, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<StartOutcome> {
  try {
    const res = await fetchImpl('/api/package', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ ...input, ...(push ? { push } : {}) }), signal: AbortSignal.timeout(20_000) })
    const j = await json(res)
    if (!j) return { ok: false, error: 'network', message: 'سرور در دسترس نیست.' }
    if (res.status === 202 && typeof j.job_id === 'string') return { ok: true, jobId: j.job_id }
    if (res.status === 400) return { ok: false, error: 'invalid', message: 'اطلاعات واردشده معتبر نیست؛ شهرها را بررسی کنید.' }
    if (res.status === 429) return { ok: false, error: 'busy', message: 'درخواست‌ها زیاد بود؛ یک دقیقه دیگر دوباره امتحان کنید.' }
    return { ok: false, error: 'unavailable', message: typeof j.message === 'string' ? j.message : 'طراحی پکیج الان ممکن نیست.' }
  } catch { return { ok: false, error: 'network', message: 'ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.' } }
}

export async function fetchJob(id: string, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<JobState> {
  try {
    const res = await fetchImpl(`/api/package/jobs/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
    if (res.status === 404) return { status: 'gone' }
    const j = await json(res); const job = j?.job as { status?: string; package?: TourPackage; error?: string } | undefined
    if (!res.ok || !job) return { status: 'offline' }
    if (job.status === 'done' && job.package) return { status: 'done', package: job.package }
    if (job.status === 'failed') return { status: 'failed', error: job.error ?? 'unavailable' }
    return { status: 'pending' }
  } catch { return { status: 'offline' } }
}

const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)) }
/** اجازهٔ اعلان می‌گیرد و (اگر مرورگر Push دارد) اشتراک می‌سازد تا هنگام بسته‌بودن برنامه هم اعلان بیاید. هر خطا ⇒ null (طراحی ادامه می‌یابد). */
export async function preparePush(): Promise<PushSubJSON | null> {
  try {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null
    if (Notification.permission === 'default') await Notification.requestPermission()
    if (Notification.permission !== 'granted') return null
    const o = await (await fetch('/api/package/options')).json() as { push_key?: string }
    if (!o.push_key) return null
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(o.push_key) })
    const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    return j.endpoint && j.keys?.p256dh && j.keys.auth ? { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } } : null
  } catch { return null }
}
