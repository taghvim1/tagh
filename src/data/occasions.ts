// Mock فقط برای نمایش UI (مناسبت‌های ثابت شمسی که هر سال تکرار می‌شوند).
// سیستم واقعی مناسبت‌ها در مراحل بعد ساخته می‌شود.
export interface Occasion { title: string; holiday: boolean; hypothetical?: boolean }

const MOCK: Record<string, Occasion> = {
  '1-1': { title: 'نوروز', holiday: true },
  '1-2': { title: 'نوروز', holiday: true },
  '1-12': { title: 'روز جمهوری اسلامی', holiday: true },
  '1-13': { title: 'سیزده‌به‌در', holiday: true },
  '2-12': { title: 'روز معلم', holiday: false },
  '3-14': { title: 'رحلت امام خمینی', holiday: true },
  '3-15': { title: 'قیام ۱۵ خرداد', holiday: true },
  '5-17': { title: 'روز خبرنگار', holiday: false },
  '7-12': { title: 'روز مهربانی', holiday: false, hypothetical: true },
  '7-5': { title: 'روز جهانی گردشگری', holiday: false },
  '9-16': { title: 'روز دانشجو', holiday: false },
  '9-30': { title: 'شب یلدا', holiday: false },
  '11-22': { title: 'پیروزی انقلاب اسلامی', holiday: true },
  '12-29': { title: 'ملی شدن صنعت نفت', holiday: true },
}

export const getOccasion = (month: number, day: number): Occasion | undefined => MOCK[`${month}-${day}`]
