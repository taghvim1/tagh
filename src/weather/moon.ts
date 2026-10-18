// محاسبات ماه بدون وابستگی و بدون شبکه: فاز، طلوع و غروب برای یک مختصات و منطقهٔ زمانی.
// فرمول‌های ساده‌شدهٔ Meeus (Astronomical Algorithms، فصل ۴۷ با جمله‌های اصلی). دقت: طلوع و غروب در حد چند دقیقه، فاز بهتر از ۱٪.
// Open-Meteo طلوع/غروب ماه نمی‌دهد، برای همین محلی حساب می‌شود.

const RAD = Math.PI / 180
const DAY_MS = 86_400_000
const J2000_MS = Date.UTC(2000, 0, 1, 12) // لحظهٔ مرجع J2000.0 (از اختلاف ΔT چشم‌پوشی شده: حدود ۷۰ ثانیه)
const norm = (x: number, m: number) => ((x % m) + m) % m
const sin = (deg: number) => Math.sin(deg * RAD)
const cos = (deg: number) => Math.cos(deg * RAD)
const days = (ms: number) => (ms - J2000_MS) / DAY_MS

/** طول دایرةالبروجی خورشید (درجه) */
function sunLongitude(d: number) {
  const M = 357.5291 + 0.98560028 * d
  return norm(280.460 + 0.9856474 * d + 1.915 * sin(M) + 0.020 * sin(2 * M), 360)
}

interface MoonPos { lon: number; lat: number; dist: number }
function moonPosition(d: number): MoonPos {
  const L = 218.316 + 13.176396 * d // طول میانگین
  const Mp = 134.963 + 13.064993 * d // آنومالی ماه
  const D = 297.850 + 12.190749 * d // کشیدگی میانگین
  const M = 357.529 + 0.985600 * d // آنومالی خورشید
  const F = 93.272 + 13.229350 * d // آرگومان عرض
  const lon = L + 6.289 * sin(Mp) + 1.274 * sin(2 * D - Mp) + 0.658 * sin(2 * D) + 0.214 * sin(2 * Mp) - 0.186 * sin(M) - 0.114 * sin(2 * F)
    + 0.059 * sin(2 * D - 2 * Mp) + 0.057 * sin(2 * D - M - Mp) + 0.053 * sin(2 * D + Mp) + 0.046 * sin(2 * D - M) + 0.041 * sin(Mp - M) - 0.035 * sin(D) - 0.031 * sin(Mp + M)
  const lat = 5.128 * sin(F) + 0.281 * sin(Mp + F) + 0.278 * sin(Mp - F) + 0.173 * sin(2 * D - F) + 0.055 * sin(2 * D - Mp + F) + 0.046 * sin(2 * D - Mp - F)
  const dist = 385001 - 20905 * cos(Mp) - 3699 * cos(2 * D - Mp) - 2956 * cos(2 * D) - 570 * cos(2 * Mp) + 246 * cos(2 * Mp - 2 * D) - 205 * cos(M - 2 * D) - 171 * cos(Mp + 2 * D) - 152 * cos(Mp + M - 2 * D)
  return { lon: norm(lon, 360), lat, dist }
}

/** ارتفاع مرکزِ ماه از افق (درجه) و ارتفاعِ آستانهٔ طلوع/غروب برای لبهٔ بالایی با احتساب انکسار و اختلاف منظر */
function altitudes(ms: number, latDeg: number, lonDeg: number) {
  const d = days(ms), m = moonPosition(d)
  const eps = 23.4393 - 3.563e-7 * d
  const ra = Math.atan2(sin(m.lon) * cos(eps) - Math.tan(m.lat * RAD) * sin(eps), cos(m.lon)) / RAD
  const dec = Math.asin(sin(m.lat) * cos(eps) + cos(m.lat) * sin(eps) * sin(m.lon)) / RAD
  const H = norm(280.46061837 + 360.98564736629 * d + lonDeg - ra, 360)
  const alt = Math.asin(sin(latDeg) * sin(dec) + cos(latDeg) * cos(dec) * cos(H)) / RAD
  const parallax = Math.asin(6378.14 / m.dist) / RAD
  return { alt, h0: 0.7275 * parallax - 34 / 60 }
}

/** فاز ماه: ۰ محاق، ۰٫۲۵ تربیع اول، ۰٫۵ بدر، ۰٫۷۵ تربیع آخر؛ fraction = نسبت قرص روشن (۰ تا ۱) */
export function moonPhaseAt(ms: number) {
  const d = days(ms)
  const elong = norm(moonPosition(d).lon - sunLongitude(d), 360)
  return { phase: elong / 360, fraction: (1 - cos(elong)) / 2, waxing: elong < 180 }
}

export type MoonPhaseName = 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent'
export function moonPhaseName(phase: number): MoonPhaseName {
  const p = norm(phase, 1)
  if (p < 0.0265 || p >= 0.9735) return 'new'
  if (p < 0.2235) return 'waxing-crescent'
  if (p < 0.2765) return 'first-quarter'
  if (p < 0.4735) return 'waxing-gibbous'
  if (p < 0.5265) return 'full'
  if (p < 0.7235) return 'waning-gibbous'
  if (p < 0.7765) return 'last-quarter'
  return 'waning-crescent'
}
export const MOON_PHASE_FA: Record<MoonPhaseName, string> = {
  new: 'محاق', 'waxing-crescent': 'هلال رو به رشد', 'first-quarter': 'تربیع اول', 'waxing-gibbous': 'رو به بدر', full: 'بدر (ماه کامل)',
  'waning-gibbous': 'پس از بدر', 'last-quarter': 'تربیع آخر', 'waning-crescent': 'هلال رو به محاق',
}

// ---- منطقهٔ زمانی (با Intl، بدون کتابخانه) ----
const fmtCache = new Map<string, Intl.DateTimeFormat>()
function parts(ms: number, tz: string) {
  let f = fmtCache.get(tz)
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); fmtCache.set(tz, f) }
  const o: Record<string, number> = {}
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== 'literal') o[p.type] = Number(p.value)
  return o
}
const offsetMs = (ms: number, tz: string) => { const p = parts(ms, tz); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000 }
/** آغاز روز محلی (YYYY-MM-DD) به‌صورت لحظهٔ UTC */
export function localDayStart(dateIso: string, tz: string) {
  const [y, m, d] = dateIso.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  let start = guess - offsetMs(guess, tz)
  const o2 = offsetMs(start, tz)
  if (guess - o2 !== start) start = guess - o2
  return start
}
/** لحظهٔ UTC ⇒ «YYYY-MM-DDTHH:MM» به وقت محلی (هم‌شکل رشتهٔ طلوع/غروب خورشید) */
export function localIso(ms: number, tz: string) {
  const p = parts(Math.round(ms / 60_000) * 60_000, tz), z = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${z(p.month)}-${z(p.day)}T${z(p.hour)}:${z(p.minute)}`
}

/** طلوع و غروب ماه در یک روز محلی؛ اگر آن روز طلوع یا غروب نداشت null */
export function moonTimes(dateIso: string, lat: number, lon: number, tz: string) {
  const start = localDayStart(dateIso, tz)
  const [y, m, d] = dateIso.split('-').map(Number)
  const end = localDayStart(new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10), tz)
  const g = (t: number) => { const a = altitudes(t, lat, lon); return a.alt - a.h0 }
  const STEP = 30 * 60_000
  let rise: number | null = null, set: number | null = null
  let t0 = start, g0 = g(t0)
  for (let t1 = start + STEP; t1 <= end + STEP / 2 && (rise === null || set === null); t1 += STEP) {
    const g1 = g(t1)
    if ((g0 < 0) !== (g1 < 0)) {
      let a = t0, b = t1, ga = g0
      for (let i = 0; i < 24; i++) { const mid = (a + b) / 2, gm = g(mid); if ((gm < 0) === (ga < 0)) { a = mid; ga = gm } else b = mid }
      const t = (a + b) / 2
      if (t >= start && t < end) { if (g1 > g0) { if (rise === null) rise = t } else if (set === null) set = t }
    }
    t0 = t1; g0 = g1
  }
  return { rise: rise === null ? null : localIso(rise, tz), set: set === null ? null : localIso(set, tz) }
}

export interface MoonDay {
  rise: string | null; set: string | null
  phase: number; fraction: number; waxing: boolean; name: MoonPhaseName
}
/** ماه یک روز: طلوع، غروب و شکل ماه در «همان شب» (ساعت ۲۱ به وقت محلی) */
export function moonForDay(dateIso: string, lat: number, lon: number, tz: string): MoonDay {
  const night = localDayStart(dateIso, tz) + 21 * 3_600_000
  const ph = moonPhaseAt(night)
  return { ...moonTimes(dateIso, lat, lon, tz), phase: ph.phase, fraction: ph.fraction, waxing: ph.waxing, name: moonPhaseName(ph.phase) }
}
