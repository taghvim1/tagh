// دستگاه‌هایی که نباید در آمار کاربران بیایند: دستگاه خودِ مدیر/توسعه‌دهنده، ربات‌ها و خزنده‌ها، اجرای محلی و خود پنل مدیریت.
// بدون این، هر بازدید ربات/خزنده (بدون حافظهٔ ماندگار) و هر مرورگر تازهٔ مدیر یک «مهمانِ جدید» می‌ساخت.
const KEY = 'tp-internal' // '1' = آزمایشی (ثبت نشود)، '0' = حتی روی localhost عادی حساب شود
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|httpclient|go-http|node-fetch|axios|postman/i

const read = (): string | null => { try { return localStorage.getItem(KEY) } catch { return null } }
export const isInternalDevice = () => read() === '1'
/** مقدار خام پرچم: '1' آزمایشی، '0' عادی، null تنظیم‌نشده */
export const readInternalFlag = () => read()
/** true = آزمایشی (ثبت نشود)، false = عادی (حتی روی localhost ثبت شود)، null = پیش‌فرض خودکار */
export function setInternalDevice(on: boolean | null) { try { on === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, on ? '1' : '0') } catch { /* فقط حافظه */ } }
export const isBotLike = () => typeof navigator !== 'undefined' && (navigator.webdriver === true || BOT_RE.test(navigator.userAgent ?? ''))
const isLocalHost = () => typeof location !== 'undefined' && /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|.+\.local)$/.test(location.hostname)
export const isAdminPath = () => typeof location !== 'undefined' && (location.pathname === '/admin' || location.pathname.startsWith('/admin/'))

/** آیا باید از ثبت نصب و ردیابی این دستگاه صرف‌نظر کرد؟ */
export function skipTelemetry(): boolean {
  if (isAdminPath() || isBotLike()) return true
  const v = read()
  if (v === '1') return true
  return v === '0' ? false : isLocalHost()
}
