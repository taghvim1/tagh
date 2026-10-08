// داده‌های Mock تورها؛ تاریخ‌ها نسبت به امروز ساخته می‌شوند تا همیشه «پیش‌رو» باشند.
import { styleOf } from './legacy'
import { addDays, toISO, withDuration } from './logic'
import type { Tour } from './types'

const FOOD = 'وعده‌های غذایی'
const PERSONAL = 'هزینه‌های شخصی و بیمهٔ تکمیلی شامل تور نیست.'

type Seed = Pick<Tour, 'id' | 'title' | 'organizerId' | 'destinationId' | 'destinationName' | 'scope' | 'tourType' | 'price' | 'budget' | 'capacity' | 'remainingCapacity' | 'meetingPoint' | 'difficulty' | 'suitableFor' | 'services' | 'guideName'> &
  { description: string; from: number; to: number; itinerary?: string[]; conditions?: string[]; active?: boolean }

export function seedTours(now: Date = new Date()): Tour[] {
  const d = (n: number) => toISO(addDays(now, n))
  const t = (x: Seed): Tour =>
    withDuration({
      id: x.id, title: x.title, organizerId: x.organizerId, destinationId: x.destinationId, destinationName: x.destinationName,
      image: `/images/destinations/${x.destinationId}.svg`, shortDescription: x.description, fullDescription: x.description,
      startDate: d(x.from), endDate: d(x.to), price: x.price, capacity: x.capacity, remainingCapacity: x.remainingCapacity,
      tourType: x.tourType, scope: x.scope, duration: 'یک روزه', budget: x.budget, difficulty: x.difficulty, travelStyle: styleOf(x.tourType),
      suitableFor: x.suitableFor, services: x.services, itinerary: x.itinerary ?? [], conditions: x.conditions ?? [PERSONAL],
      meetingPoint: x.meetingPoint, guideName: x.guideName, contact: '', registrationLink: '', active: x.active ?? true,
    })
  return [
    t({ id: 1, title: 'تور کویر مصر', organizerId: 1, destinationId: 11, destinationName: 'کویر مصر', scope: 'domestic', tourType: 'کویر', description: 'دو روز شب‌مانی در دل شن‌زارها، آسمان پرستاره و غروب کویر با راهنمایی که مسیرها را می‌شناسد.', from: 5, to: 6, price: 3_800_000, budget: 'متوسط', capacity: 20, remainingCapacity: 7, meetingPoint: 'تهران، میدان آزادی', difficulty: 'متوسط', suitableFor: ['زوج', 'دوستان'], services: ['اقامت در کمپ', FOOD, 'راهنمای تور', 'ایاب‌وذهاب'], guideName: 'مریم احمدی', itinerary: ['روز اول: حرکت از تهران، رسیدن به کویر و غروب‌گردی', 'روز دوم: طلوع کویر و بازگشت'] }),
    t({ id: 2, title: 'تور پاییزی ماسوله', organizerId: 2, destinationId: 8, destinationName: 'ماسوله', scope: 'domestic', tourType: 'جنگل', description: 'پیاده‌روی در جنگل‌های رنگی و کوچه‌های پلکانی ماسوله با توقف در اقامتگاه بوم‌گردی.', from: 12, to: 13, price: 2_200_000, budget: 'اقتصادی', capacity: 24, remainingCapacity: 11, meetingPoint: 'تهران، ترمینال غرب', difficulty: 'آسان', suitableFor: ['خانواده', 'زوج', 'دوستان'], services: ['اقامت', 'صبحانه', 'ایاب‌وذهاب'], guideName: 'علی رضایی' }),
    t({ id: 3, title: 'تور چابهار', organizerId: 3, destinationId: 6, destinationName: 'چابهار', scope: 'domestic', tourType: 'ساحل', description: 'پنج روز میان ساحل‌های دریای عمان و کوه‌های مینیاتوری، با زمان آزاد برای دریا.', from: 24, to: 28, price: 9_500_000, budget: 'متوسط', capacity: 16, remainingCapacity: 3, meetingPoint: 'فرودگاه چابهار', difficulty: 'آسان', suitableFor: ['زوج', 'دوستان', 'انفرادی'], services: ['اقامت', 'صبحانه', 'راهنما', 'قایق‌سواری'], guideName: 'حسین کریمی' }),
    t({ id: 4, title: 'تور یزد و کویر', organizerId: 2, destinationId: 1, destinationName: 'یزد', scope: 'domestic', tourType: 'فرهنگی', description: 'چهار روز گشت در بافت تاریخی یزد و یک شب‌مانی کویری؛ ترکیبی از فرهنگ و طبیعت.', from: 40, to: 43, price: 6_400_000, budget: 'متوسط', capacity: 18, remainingCapacity: 9, meetingPoint: 'یزد، میدان امیرچخماق', difficulty: 'آسان', suitableFor: ['خانواده', 'زوج', 'دوستان'], services: ['اقامت', FOOD, 'راهنمای تور', 'بلیت بناها'], guideName: 'نرگس صادقی' }),
    t({ id: 5, title: 'تور استانبول', organizerId: 2, destinationId: 13, destinationName: 'استانبول', scope: 'international', tourType: 'شهری', description: 'شش روز گردش در استانبول؛ از ایاصوفیه تا بازار بزرگ و سفر دریایی در بسفر.', from: 85, to: 90, price: 38_000_000, budget: 'لوکس', capacity: 14, remainingCapacity: 5, meetingPoint: 'فرودگاه امام خمینی', difficulty: 'آسان', suitableFor: ['خانواده', 'زوج', 'دوستان'], services: ['بلیت هواپیما', 'هتل', 'صبحانه', 'راهنما'], conditions: ['ویزا (در صورت نیاز) و هزینه‌های شخصی شامل تور نیست.'], guideName: 'سارا حسینی' }),
    t({ id: 6, title: 'تور تفلیس', organizerId: 3, destinationId: 14, destinationName: 'تفلیس', scope: 'international', tourType: 'شهری', description: 'چهار روز در کوچه‌های سنگی تفلیس، گرمابه‌های گوگردی و کافه‌های رنگارنگ.', from: 9, to: 12, price: 24_000_000, budget: 'متوسط', capacity: 12, remainingCapacity: 0, meetingPoint: 'فرودگاه امام خمینی', difficulty: 'آسان', suitableFor: ['زوج', 'دوستان', 'انفرادی'], services: ['بلیت هواپیما', 'هتل', 'صبحانه'], guideName: 'رضا نوری' }),
    // تور پایان‌یافته؛ در /tours و تقویم نمایش داده نمی‌شود ولی در پنل مدیریت می‌ماند
    t({ id: 7, title: 'تور گذشتهٔ کاشان', organizerId: 1, destinationId: 4, destinationName: 'کاشان', scope: 'domestic', tourType: 'فرهنگی', description: 'تور یک‌روزهٔ کاشان که برگزار شده است.', from: -10, to: -10, price: 1_200_000, budget: 'اقتصادی', capacity: 20, remainingCapacity: 0, meetingPoint: 'تهران، میدان آزادی', difficulty: 'آسان', suitableFor: ['خانواده'], services: ['ایاب‌وذهاب'], guideName: 'علی رضایی' }),
  ]
}
