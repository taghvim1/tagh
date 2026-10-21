import type { PackageInput, TourPackage } from './types'

export const BUDGETS = ['اقتصادی', 'متوسط', 'لوکس']
export const VEHICLES = ['خودروی شخصی', 'اتوبوس', 'قطار', 'هواپیما', 'کشتی یا لنج']
export const TRIP_TYPES = ['خانوادگی', 'زوج و ماه‌عسل', 'دوستانه', 'تک‌نفره', 'طبیعت‌گردی', 'فرهنگی و تاریخی', 'ماجراجویی', 'زیارتی', 'خرید', 'ساحلی و تفریحی']

export type PackageOutcome = { ok: true; package: TourPackage } | { ok: false; error: 'invalid' | 'busy' | 'unavailable' | 'network'; message: string }

/** درخواست طراحی پکیج از سرور (طراحی چند ثانیه طول می‌کشد). */
export async function requestPackage(input: PackageInput, fetchImpl: typeof fetch = (...a) => fetch(...a)): Promise<PackageOutcome> {
  try {
    const res = await fetchImpl('/api/package', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(90_000) })
    if (!(res.headers.get('content-type') ?? '').includes('json')) return { ok: false, error: 'network', message: 'سرور در دسترس نیست.' }
    const j = (await res.json()) as { package?: TourPackage; message?: string; error?: string }
    if (res.ok && j.package) return { ok: true, package: j.package }
    if (res.status === 400) return { ok: false, error: 'invalid', message: 'اطلاعات واردشده معتبر نیست؛ شهرها را بررسی کنید.' }
    if (res.status === 429) return { ok: false, error: 'busy', message: 'درخواست‌ها زیاد بود؛ یک دقیقه دیگر دوباره امتحان کنید.' }
    return { ok: false, error: 'unavailable', message: j.message ?? 'طراحی پکیج الان ممکن نیست.' }
  } catch { return { ok: false, error: 'network', message: 'ارتباط با سرور برقرار نشد؛ اینترنت را بررسی کنید.' } }
}
