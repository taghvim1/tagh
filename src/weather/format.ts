import { MONTHS, WEEKDAYS, faNum, fromGregorian } from '../lib/jalali'

const DIRS = ['شمال', 'شمال‌شرق', 'شرق', 'جنوب‌شرق', 'جنوب', 'جنوب‌غرب', 'غرب', 'شمال‌غرب']
/** جهتی که باد «از آن» می‌وزد (استاندارد Open-Meteo: ۰=از شمال) */
export const windFrom = (deg: number | null | undefined) => (deg == null ? null : DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8])

export const uvLabel = (uv: number | null | undefined) => (uv == null ? null : uv < 3 ? 'کم' : uv < 6 ? 'متوسط' : uv < 8 ? 'زیاد' : uv < 11 ? 'بسیار زیاد' : 'شدید')
export const num = (n: number | null | undefined, digits = 0) => (n == null ? '—' : faNum(Math.round(n * 10 ** digits) / 10 ** digits).replace(/[\u200e\u200f]/g, '').replace('-', '−'))
export const degree = (n: number | null | undefined) => (n == null ? '—' : `\u2066${num(n)}°\u2069`) // جداسازی جهت تا علامت درجه کنار عدد بماند
export const km = (m: number | null | undefined) => (m == null ? null : m >= 1000 ? `${num(m / 1000, 1)} کیلومتر` : `${num(m)} متر`)

const parseLocal = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d, 12) }
/** «سه‌شنبه ۲۱ مهر» از «YYYY-MM-DD» */
export function dayLabel(iso: string): string {
  const d = parseLocal(iso), j = fromGregorian(d)
  return `${WEEKDAYS[(d.getDay() + 1) % 7]} ${faNum(j.day)} ${MONTHS[j.month - 1]}`
}
export const hourLabel = (iso: string) => `${faNum(Number(iso.slice(11, 13)))}:۰۰`
export const clockOf = (iso: string | null | undefined) => (iso ? `${faNum(Number(iso.slice(11, 13)))}:${faNum(Number(iso.slice(14, 16))).padStart(2, '۰')}` : null)
