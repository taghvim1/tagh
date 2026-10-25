// جلوگیری از درخواست‌های تکراری به سرور: اگر آخرین دریافت موفق تازه است (و هنوز همان روز است) دوباره نمی‌پرسد.
const key = (k: string) => `taghvim-fetched-${k}`
const day = (t: number) => new Date(t).toDateString()
export function isFresh(name: string, maxAgeMs: number, now = Date.now()): boolean {
  try { const t = Number(localStorage.getItem(key(name)) ?? 0); return t > 0 && now - t < maxAgeMs && day(t) === day(now) } catch { return false }
}
export const markFetched = (name: string, now = Date.now()) => { try { localStorage.setItem(key(name), String(now)) } catch { /* فقط حافظه */ } }
