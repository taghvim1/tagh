// تحلیل آب‌وهوای تاریخی: هر روز میلادی به تاریخ شمسی تبدیل و در ماه/فصل شمسی پروژه جمع می‌شود.
import { fromGregorian, monthLength } from '../../lib/jalali'
import { SEASONS } from '../../travel/season'
import type { ClimateStats, DailySeries, PeriodStats } from './types'

/** معیار «روز بارانی»: مجموع بارش روزانه حداقل ۱ میلی‌متر (آستانهٔ رایج روز مرطوب در اقلیم‌شناسی) */
export const RAINY_DAY_MM = 1

interface Acc { days: number; tm: [number, number]; tx: [number, number]; tn: [number, number]; codes: Map<number, number>; groups: Map<string, { n: number; precip: number; rainy: number; expected: number }> }
const newAcc = (): Acc => ({ days: 0, tm: [0, 0], tx: [0, 0], tn: [0, 0], codes: new Map(), groups: new Map() })
const round1 = (n: number) => Math.round(n * 10) / 10
const avg = ([s, c]: [number, number]) => (c ? round1(s / c) : null)

function finish(a: Acc): PeriodStats {
  const complete = [...a.groups.values()].filter((g) => g.n === g.expected)
  let code: number | null = null, best = 0
  for (const [k, v] of a.codes) if (v > best || (v === best && code !== null && k < code)) { code = k; best = v }
  return {
    days: a.days, tempMean: avg(a.tm), tempMax: avg(a.tx), tempMin: avg(a.tn),
    precipitationMm: complete.length ? round1(complete.reduce((s, g) => s + g.precip, 0) / complete.length) : null,
    rainyDays: complete.length ? round1(complete.reduce((s, g) => s + g.rainy, 0) / complete.length) : null,
    dominantCode: code,
  }
}

const add = (p: [number, number], v: number | null) => { if (v !== null) { p[0] += v; p[1] += 1 } }

export function analyzeSeries(s: DailySeries): ClimateStats {
  const months = Array.from({ length: 12 }, newAcc)
  const seasons = SEASONS.map(newAcc)
  const seasonOf = (m: number) => SEASONS.findIndex((x) => (x.months as readonly number[]).includes(m))

  for (let i = 0; i < s.time.length; i++) {
    const [y, m, d] = s.time[i].split('-').map(Number)
    const j = fromGregorian(new Date(y, m - 1, d, 12))
    const si = seasonOf(j.month)
    const mean = s.temperature_2m_mean[i] ?? null, max = s.temperature_2m_max[i] ?? null, min = s.temperature_2m_min[i] ?? null
    const prec = s.precipitation_sum[i] ?? null, code = s.weather_code[i] ?? null
    for (const [a, key, expected] of [
      [months[j.month - 1], `${j.year}-${j.month}`, monthLength({ year: j.year, month: j.month })],
      [seasons[si], `${j.year}-${si}`, SEASONS[si].months.reduce((n, mm) => n + monthLength({ year: j.year, month: mm }), 0)],
    ] as [Acc, string, number][]) {
      add(a.tm, mean); add(a.tx, max); add(a.tn, min)
      if (mean !== null || max !== null || min !== null) a.days += 1
      if (code !== null) a.codes.set(code, (a.codes.get(code) ?? 0) + 1)
      const g = a.groups.get(key) ?? { n: 0, precip: 0, rainy: 0, expected }
      if (prec !== null) { g.n += 1; g.precip += prec; if (prec >= RAINY_DAY_MM) g.rainy += 1 }
      a.groups.set(key, g)
    }
  }
  return {
    months: months.map(finish),
    seasons: Object.fromEntries(SEASONS.map((x, i) => [x.id, finish(seasons[i])])) as ClimateStats['seasons'],
    rainyDayThresholdMm: RAINY_DAY_MM,
  }
}
