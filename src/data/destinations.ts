// داده‌های Mock مقصدها (فقط ایران)؛ بدون عکس، API و دیتابیس. در مراحل بعد با منبع واقعی جایگزین می‌شود.
import { BUDGETS, DURATIONS, TRIP_TYPES } from './travelFilters'

export type Season = 'بهار' | 'تابستان' | 'پاییز' | 'زمستان'

export interface Destination {
  id: number
  name: string
  province: string
  type: (typeof TRIP_TYPES)[number]
  duration: (typeof DURATIONS)[number]
  budget: (typeof BUDGETS)[number]
  best_seasons: Season[]
  description: string
}

export const MOCK_DESTINATIONS: Destination[] = [
  { id: 1, name: 'یزد', province: 'یزد', type: 'تاریخی و فرهنگی', duration: '۲ تا ۳ روز', budget: 'متوسط', best_seasons: ['بهار', 'پاییز'], description: 'شهر خشت و بادگیر با بافت تاریخی و معماری سازگار با کویر.' },
  { id: 2, name: 'اصفهان', province: 'اصفهان', type: 'تاریخی و فرهنگی', duration: '۲ تا ۳ روز', budget: 'لوکس', best_seasons: ['بهار', 'پاییز'], description: 'میدان‌ها، پل‌ها و باغ‌های تاریخی در قلب ایران.' },
  { id: 3, name: 'شیراز', province: 'فارس', type: 'شهری', duration: '۲ تا ۳ روز', budget: 'راحت', best_seasons: ['بهار', 'پاییز'], description: 'شهر باغ‌ها و شعر، نزدیک به تخت جمشید.' },
  { id: 4, name: 'کاشان', province: 'اصفهان', type: 'تاریخی و فرهنگی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'پاییز'], description: 'خانه‌های تاریخی و باغ فین؛ مناسب سفر کوتاه.' },
  { id: 5, name: 'کرمان', province: 'کرمان', type: 'تاریخی و فرهنگی', duration: '۴ تا ۷ روز', budget: 'متوسط', best_seasons: ['بهار', 'پاییز'], description: 'بازار و باغ‌های تاریخی و دسترسی به بیابان لوت.' },
  { id: 6, name: 'چابهار', province: 'سیستان و بلوچستان', type: 'ساحلی', duration: '۴ تا ۷ روز', budget: 'متوسط', best_seasons: ['پاییز', 'زمستان'], description: 'سواحل دریای عمان و طبیعت جنوب شرق ایران.' },
  { id: 7, name: 'هرمز', province: 'هرمزگان', type: 'ماجراجویی', duration: '۲ تا ۳ روز', budget: 'اقتصادی', best_seasons: ['پاییز', 'زمستان'], description: 'جزیره‌ای با خاک‌های رنگی و ساحل سرخ در خلیج فارس.' },
  { id: 8, name: 'ماسوله', province: 'گیلان', type: 'طبیعت‌گردی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'تابستان', 'پاییز'], description: 'روستای پلکانی در دل کوه‌های جنگلی شمال ایران.' },
  { id: 9, name: 'رامسر', province: 'مازندران', type: 'ساحلی', duration: '۲ تا ۳ روز', budget: 'راحت', best_seasons: ['بهار', 'تابستان'], description: 'شهر ساحلی در شمال ایران، میان دریای خزر و کوه‌های جنگلی.' },
  { id: 10, name: 'کردستان', province: 'کردستان', type: 'ماجراجویی', duration: 'بیش از یک هفته', budget: 'متوسط', best_seasons: ['بهار', 'تابستان'], description: 'روستاهای کوهستانی، فرهنگ محلی و طبیعت غرب ایران.' },
  { id: 11, name: 'کویر مصر', province: 'اصفهان', type: 'کویر', duration: '۲ تا ۳ روز', budget: 'متوسط', best_seasons: ['پاییز', 'زمستان'], description: 'شن‌زارها و آسمان شب کویر نزدیک خور و بیابانک.' },
  { id: 12, name: 'ابیانه', province: 'اصفهان', type: 'تاریخی و فرهنگی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'پاییز'], description: 'روستای سرخ‌رنگ تاریخی با معماری و پوشش محلی.' },
]

const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, '').trim().toLowerCase()

/** عبارت‌های مقصد (جداشده با «،» یا «,») */
export const destinationTerms = (text: string) => text.split(/[،,]/).map(normalize).filter(Boolean)

/** آیا مقصد با یکی از عبارت‌ها (روی نام، استان یا توضیح) مطابقت دارد؟ */
export function matchesDestination(d: Destination, terms: string[]): boolean {
  const haystack = normalize(`${d.name} ${d.province} ${d.description}`)
  return terms.some((t) => haystack.includes(t))
}
