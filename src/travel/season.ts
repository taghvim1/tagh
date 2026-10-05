import type { Season } from '../data/destinations'

/** فصل بر اساس ماه شمسی: ۱–۳ بهار، ۴–۶ تابستان، ۷–۹ پاییز، ۱۰–۱۲ زمستان */
const SEASON_BY_MONTH: Season[] = ['بهار', 'بهار', 'بهار', 'تابستان', 'تابستان', 'تابستان', 'پاییز', 'پاییز', 'پاییز', 'زمستان', 'زمستان', 'زمستان']
export const seasonOfMonth = (month: number): Season => SEASON_BY_MONTH[month - 1]
