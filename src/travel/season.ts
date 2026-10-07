import type { Season, SeasonKey } from '../data/destinations'

export interface SeasonInfo { id: SeasonKey; title: Season; months: [number, number, number] }

/** چهار فصل و ماه‌های شمسی آن‌ها: ۱–۳ بهار، ۴–۶ تابستان، ۷–۹ پاییز، ۱۰–۱۲ زمستان */
export const SEASONS: SeasonInfo[] = [
  { id: 'spring', title: 'بهار', months: [1, 2, 3] },
  { id: 'summer', title: 'تابستان', months: [4, 5, 6] },
  { id: 'autumn', title: 'پاییز', months: [7, 8, 9] },
  { id: 'winter', title: 'زمستان', months: [10, 11, 12] },
]

export const seasonOfMonth = (month: number): Season => (SEASONS.find((s) => s.months.includes(month as never)) ?? SEASONS[0]).title
export const seasonKey = (season: Season): SeasonKey => (SEASONS.find((s) => s.title === season) ?? SEASONS[0]).id
