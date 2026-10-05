// داده‌های Mock مقصدها؛ جدا از UI و با ساختاری قابل انتقال به Backend/API آینده.
// تصاویر، آب‌وهوا، جاذبه‌ها و ویزا نمونه‌اند و باید قبل از استفادهٔ واقعی با منبع معتبر جایگزین شوند.
export const TRIP_TYPES = ['طبیعت‌گردی', 'تاریخی و فرهنگی', 'ماجراجویی', 'شهری', 'ساحلی', 'کویر'] as const
export const DURATIONS = ['یک روزه', '۲ تا ۳ روز', '۴ تا ۷ روز', 'بیش از یک هفته'] as const
export const BUDGETS = ['اقتصادی', 'متوسط', 'راحت', 'لوکس'] as const
export type Season = 'بهار' | 'تابستان' | 'پاییز' | 'زمستان'

export interface Destination {
  id: number
  name: string
  country: string
  /** استان (مقصد داخلی) یا شهر (مقصد خارجی) */
  province_or_city: string
  scope: 'domestic' | 'international'
  type: (typeof TRIP_TYPES)[number]
  duration: (typeof DURATIONS)[number]
  budget: (typeof BUDGETS)[number]
  best_seasons: Season[]
  average_temperature: string
  weather: string
  rainfall: string
  description: string
  recommended_for: string[]
  attractions: string[]
  /** برای مقصد داخلی null (برای شهروند ایرانی) */
  visa_required: boolean | null
  image: string
}

type Base = Omit<Destination, 'id' | 'image' | 'scope' | 'country' | 'visa_required'>
const domestic = (id: number, d: Base): Destination => ({ id, country: 'ایران', scope: 'domestic', visa_required: null, image: `/images/destinations/${id}.svg`, ...d })
const abroad = (id: number, country: string, visa: boolean, d: Base): Destination => ({ id, country, scope: 'international', visa_required: visa, image: `/images/destinations/${id}.svg`, ...d })

export const MOCK_DESTINATIONS: Destination[] = [
  domestic(1, { name: 'یزد', province_or_city: 'یزد', type: 'تاریخی و فرهنگی', duration: '۲ تا ۳ روز', budget: 'متوسط', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۸ تا ۳۰ درجه', weather: 'گرم و خشک با شب‌های خنک', rainfall: 'بسیار کم', description: 'شهر خشت و بادگیر با بافت تاریخی و معماری سازگار با کویر.', recommended_for: ['دوستداران معماری و تاریخ', 'عکاسان'], attractions: ['مسجد جامع یزد', 'بافت تاریخی شهر', 'باغ دولت‌آباد'] }),
  domestic(2, { name: 'اصفهان', province_or_city: 'اصفهان', type: 'تاریخی و فرهنگی', duration: '۲ تا ۳ روز', budget: 'لوکس', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۵ تا ۲۸ درجه', weather: 'معتدل و خشک', rainfall: 'کم', description: 'میدان‌ها، پل‌ها و باغ‌های تاریخی در قلب ایران.', recommended_for: ['دوستداران هنر و معماری', 'سفر خانوادگی'], attractions: ['میدان نقش جهان', 'سی‌وسه‌پل', 'مسجد شیخ لطف‌الله', 'کاخ چهلستون'] }),
  domestic(3, { name: 'شیراز', province_or_city: 'فارس', type: 'شهری', duration: '۲ تا ۳ روز', budget: 'راحت', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۷ تا ۲۸ درجه', weather: 'معتدل و آفتابی', rainfall: 'کم تا متوسط', description: 'شهر باغ‌ها و شعر، نزدیک به تخت جمشید.', recommended_for: ['دوستداران شعر و تاریخ', 'سفر خانوادگی'], attractions: ['آرامگاه حافظ', 'باغ ارم', 'مسجد نصیرالملک', 'تخت جمشید (در نزدیکی)'] }),
  domestic(4, { name: 'کاشان', province_or_city: 'اصفهان', type: 'تاریخی و فرهنگی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۸ تا ۳۰ درجه', weather: 'گرم و خشک', rainfall: 'بسیار کم', description: 'خانه‌های تاریخی و باغ فین؛ مناسب سفر کوتاه.', recommended_for: ['سفر کوتاه آخر هفته', 'علاقه‌مندان به خانه‌های تاریخی'], attractions: ['باغ فین', 'خانهٔ طباطبایی‌ها', 'خانهٔ بروجردی‌ها'] }),
  domestic(5, { name: 'کرمان', province_or_city: 'کرمان', type: 'تاریخی و فرهنگی', duration: '۴ تا ۷ روز', budget: 'متوسط', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۵ تا ۲۸ درجه', weather: 'خشک با شب‌های خنک', rainfall: 'کم', description: 'بازار و باغ‌های تاریخی و دسترسی به بیابان لوت.', recommended_for: ['علاقه‌مندان به طبیعت کویری', 'دوستداران تاریخ'], attractions: ['مجموعهٔ گنجعلی‌خان', 'باغ شاهزادهٔ ماهان', 'کلوت‌های شهداد'] }),
  domestic(6, { name: 'چابهار', province_or_city: 'سیستان و بلوچستان', type: 'ساحلی', duration: '۴ تا ۷ روز', budget: 'متوسط', best_seasons: ['پاییز', 'زمستان'], average_temperature: '۲۲ تا ۳۰ درجه', weather: 'گرم و مرطوب دریایی', rainfall: 'کم', description: 'سواحل دریای عمان و طبیعت جنوب شرق ایران.', recommended_for: ['دوستداران دریا و ساحل', 'سفر طولانی'], attractions: ['بندر تیس', 'کوه‌های مینیاتوری', 'ساحل‌های دریای عمان'] }),
  domestic(7, { name: 'هرمز', province_or_city: 'هرمزگان', type: 'ماجراجویی', duration: '۲ تا ۳ روز', budget: 'اقتصادی', best_seasons: ['پاییز', 'زمستان'], average_temperature: '۲۲ تا ۳۰ درجه', weather: 'گرم و شرجی', rainfall: 'کم', description: 'جزیره‌ای با خاک‌های رنگی و ساحل سرخ در خلیج فارس.', recommended_for: ['ماجراجویان', 'عکاسان'], attractions: ['ساحل سرخ', 'درهٔ رنگین‌کمان', 'قلعهٔ پرتغالی‌ها'] }),
  domestic(8, { name: 'ماسوله', province_or_city: 'گیلان', type: 'طبیعت‌گردی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'تابستان', 'پاییز'], average_temperature: '۱۲ تا ۲۵ درجه', weather: 'خنک و مه‌آلود', rainfall: 'زیاد', description: 'روستای پلکانی در دل کوه‌های جنگلی شمال ایران.', recommended_for: ['دوستداران طبیعت', 'سفر کوتاه'], attractions: ['بافت پلکانی روستا', 'بازار سنتی', 'جنگل‌های اطراف'] }),
  domestic(9, { name: 'رامسر', province_or_city: 'مازندران', type: 'ساحلی', duration: '۲ تا ۳ روز', budget: 'راحت', best_seasons: ['بهار', 'تابستان'], average_temperature: '۱۸ تا ۳۰ درجه', weather: 'معتدل و مرطوب', rainfall: 'زیاد', description: 'شهر ساحلی در شمال ایران، میان دریای خزر و کوه‌های جنگلی.', recommended_for: ['سفر خانوادگی', 'دوستداران دریا و جنگل'], attractions: ['ساحل دریای خزر', 'تله‌کابین رامسر', 'کاخ‌موزهٔ رامسر'] }),
  domestic(10, { name: 'کردستان', province_or_city: 'کردستان', type: 'ماجراجویی', duration: 'بیش از یک هفته', budget: 'متوسط', best_seasons: ['بهار', 'تابستان'], average_temperature: '۱۵ تا ۲۸ درجه', weather: 'معتدل کوهستانی', rainfall: 'متوسط', description: 'روستاهای کوهستانی، فرهنگ محلی و طبیعت غرب ایران.', recommended_for: ['کوهنوردان', 'علاقه‌مندان به فرهنگ محلی'], attractions: ['اورامانات', 'پالنگان', 'دریاچهٔ زریوار'] }),
  domestic(11, { name: 'کویر مصر', province_or_city: 'اصفهان', type: 'کویر', duration: '۲ تا ۳ روز', budget: 'متوسط', best_seasons: ['پاییز', 'زمستان'], average_temperature: '۱۰ تا ۲۵ درجه', weather: 'روزهای ملایم و شب‌های سرد', rainfall: 'بسیار کم', description: 'شن‌زارها و آسمان شب کویر نزدیک خور و بیابانک.', recommended_for: ['شب‌گردان کویر', 'عکاسان آسمان شب'], attractions: ['شن‌زارها', 'آسمان پرستاره', 'شب‌مانی در کویر'] }),
  domestic(12, { name: 'ابیانه', province_or_city: 'اصفهان', type: 'تاریخی و فرهنگی', duration: 'یک روزه', budget: 'اقتصادی', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۲ تا ۲۵ درجه', weather: 'معتدل کوهستانی', rainfall: 'کم', description: 'روستای سرخ‌رنگ تاریخی با معماری و پوشش محلی.', recommended_for: ['دوستداران روستاهای تاریخی', 'عکاسان'], attractions: ['بافت سرخ‌رنگ روستا', 'پوشش سنتی مردم', 'کوچه‌های تاریخی'] }),
  // نمونه‌های خارجی برای تست فیلتر داخلی/خارجی
  abroad(13, 'ترکیه', false, { name: 'استانبول', province_or_city: 'استانبول', type: 'تاریخی و فرهنگی', duration: '۴ تا ۷ روز', budget: 'راحت', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۴ تا ۲۴ درجه', weather: 'معتدل دریایی', rainfall: 'متوسط', description: 'شهری میان دو قاره با بازارها و بناهای تاریخی کنار تنگهٔ بسفر.', recommended_for: ['دوستداران تاریخ و بازار', 'سفر خانوادگی'], attractions: ['ایاصوفیه', 'مسجد سلطان‌احمد', 'بازار بزرگ', 'کاخ توپکاپی'] }),
  abroad(14, 'گرجستان', false, { name: 'تفلیس', province_or_city: 'تفلیس', type: 'شهری', duration: '۲ تا ۳ روز', budget: 'اقتصادی', best_seasons: ['بهار', 'تابستان', 'پاییز'], average_temperature: '۱۵ تا ۳۰ درجه', weather: 'معتدل قاره‌ای', rainfall: 'متوسط', description: 'پایتخت گرجستان با کوچه‌های قدیمی، گرمابه‌ها و خانه‌های رنگارنگ.', recommended_for: ['سفر اقتصادی', 'دوستداران شهر قدیمی'], attractions: ['شهر قدیم', 'قلعهٔ ناریکالا', 'گرمابه‌های گوگردی'] }),
  abroad(15, 'امارات', true, { name: 'دبی', province_or_city: 'دبی', type: 'شهری', duration: '۲ تا ۳ روز', budget: 'لوکس', best_seasons: ['پاییز', 'زمستان'], average_temperature: '۲۲ تا ۳۲ درجه', weather: 'گرم و آفتابی', rainfall: 'بسیار کم', description: 'شهر آسمان‌خراش‌ها و مراکز خرید در کنار خلیج فارس.', recommended_for: ['علاقه‌مندان به خرید و تفریح', 'سفر لوکس'], attractions: ['برج خلیفه', 'دبی‌مال', 'ساحل جمیرا', 'بازار طلا'] }),
  abroad(16, 'جمهوری آذربایجان', true, { name: 'باکو', province_or_city: 'باکو', type: 'ساحلی', duration: '۲ تا ۳ روز', budget: 'متوسط', best_seasons: ['بهار', 'پاییز'], average_temperature: '۱۴ تا ۲۵ درجه', weather: 'معتدل و بادخیز', rainfall: 'کم', description: 'شهر قدیمی و بلوار ساحلی کنار دریای خزر.', recommended_for: ['سفر کوتاه شهری', 'دوستداران دریا و شهر قدیمی'], attractions: ['ایچری‌شهر', 'برج دختر', 'بلوار ساحلی'] }),
]

/** برچسب محل: «استان/شهر، کشور»؛ اگر با نام مقصد یکی باشد فقط کشور */
export const locationLabel = (d: Destination) => (d.province_or_city === d.name ? d.country : `${d.province_or_city}، ${d.country}`)

export const findDestination = (id: number) => MOCK_DESTINATIONS.find((d) => d.id === id)
