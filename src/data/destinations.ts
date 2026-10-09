// مدل و داده‌های Mock مقصدها؛ جدا از UI و آمادهٔ جایگزینی با API (دسترسی فقط از طریق travel/repository.ts).
// آب‌وهوا، جاذبه‌ها و ویزا نمونه و تقریبی‌اند و باید قبل از استفادهٔ واقعی با منبع معتبر جایگزین شوند.
import { SEASONS } from '../travel/season'

export const TRAVEL_TYPES = ['طبیعت', 'جنگل', 'ساحل', 'کویر', 'کوهستان', 'تاریخی', 'فرهنگی', 'ماجراجویی', 'شهری'] as const
export const COMPANIONS = ['خانواده', 'زوج', 'دوستان', 'سفر انفرادی'] as const
export const DURATIONS = ['یک روزه', '۲ تا ۳ روز', '۴ تا ۷ روز', 'بیش از یک هفته'] as const
export const BUDGETS = ['اقتصادی', 'متوسط', 'راحت', 'لوکس'] as const

export type Season = 'بهار' | 'تابستان' | 'پاییز' | 'زمستان'
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter'
export type Rating = 'excellent' | 'good' | 'acceptable' | 'not_recommended'
export type Level = 'low' | 'medium' | 'high'

export const RATING_LABEL: Record<Rating, string> = { excellent: 'عالی', good: 'مناسب', acceptable: 'قابل قبول', not_recommended: 'نامناسب' }
export const LEVEL_LABEL: Record<Level, string> = { low: 'کم', medium: 'متوسط', high: 'زیاد' }

/** پارامترهای آب‌وهوایی یک فصل برای یک مقصد؛ مستقیماً توسط موتور پیشنهاد استفاده می‌شود */
export interface SeasonClimate {
  rating: Rating
  average_temperature: number
  temperature_min: number
  temperature_max: number
  weather_condition: string
  rainfall: Level
  humidity: Level
  /** اولویت دستی مدیر برای ترتیب (کوچک؛ فقط در امتیاز نهایی اثر دارد) */
  priority: number
  description: string
}

export interface Destination {
  id: number
  name: string
  country: string
  /** استان (مقصد داخلی) یا شهر (مقصد خارجی) */
  province_or_city: string
  scope: 'domestic' | 'international'
  type: (typeof TRAVEL_TYPES)[number][]
  description: string
  image: string
  season_suitability: Record<SeasonKey, SeasonClimate>
  duration: (typeof DURATIONS)[number]
  budget: (typeof BUDGETS)[number]
  companions: (typeof COMPANIONS)[number][]
  recommended_for: string[]
  attractions: string[]
  /** برای مقصد داخلی null (برای شهروند ایرانی) */
  visa_required: boolean | null
  /** کیفیت/محبوبیت نمونه (۰ تا ۱۰) برای ترتیب نهایی */
  quality: number
  enabled: boolean
  /** مختصات مقصد (درجه) برای دریافت آب‌وهوای تاریخی؛ اگر نباشد، آب‌وهوای تاریخی آن مقصد دریافت نمی‌شود */
  latitude?: number
  longitude?: number
  // --- فیلدهای مشتق از season_suitability (با withDerived محاسبه می‌شوند) ---
  best_seasons: Season[]
  best_months: number[]
  bad_months: number[]
  average_temperature: number
  temperature_min: number
  temperature_max: number
  weather_condition: string
  rainfall: Level
  humidity: Level
}

type Derived = 'best_seasons' | 'best_months' | 'bad_months' | 'average_temperature' | 'temperature_min' | 'temperature_max' | 'weather_condition' | 'rainfall' | 'humidity'
export type DestinationInput = Omit<Destination, Derived>

const mode = <T,>(xs: T[]): T => [...xs].sort((a, b) => xs.filter((x) => x === b).length - xs.filter((x) => x === a).length)[0]

/** خلاصهٔ سالانه از روی داده‌های فصلی (فصل‌های «عالی/مناسب» = بهترین زمان، «نامناسب» = ماه‌های بد) */
export function withDerived(input: DestinationInput): Destination {
  const rows = SEASONS.map((s) => ({ s, c: input.season_suitability[s.id] }))
  const best = rows.filter((r) => r.c.rating === 'excellent' || r.c.rating === 'good')
  const bad = rows.filter((r) => r.c.rating === 'not_recommended')
  const lead = rows.find((r) => r.c.rating === 'excellent') ?? best[0] ?? rows[0]
  return {
    ...input,
    best_seasons: best.map((r) => r.s.title),
    best_months: best.flatMap((r) => r.s.months),
    bad_months: bad.flatMap((r) => r.s.months),
    average_temperature: Math.round(rows.reduce((a, r) => a + r.c.average_temperature, 0) / rows.length),
    temperature_min: Math.min(...rows.map((r) => r.c.temperature_min)),
    temperature_max: Math.max(...rows.map((r) => r.c.temperature_max)),
    weather_condition: lead.c.weather_condition,
    rainfall: mode(rows.map((r) => r.c.rainfall)),
    humidity: mode(rows.map((r) => r.c.humidity)),
  }
}

type R = Rating
const E: R = 'excellent', G: R = 'good', A: R = 'acceptable', N: R = 'not_recommended'
const L: Level = 'low', M: Level = 'medium', H: Level = 'high'
const c = (rating: R, avg: number, min: number, max: number, cond: string, rain: Level, hum: Level, description: string): SeasonClimate => ({ rating, average_temperature: avg, temperature_min: min, temperature_max: max, weather_condition: cond, rainfall: rain, humidity: hum, priority: 0, description })
const seasons = (spring: SeasonClimate, summer: SeasonClimate, autumn: SeasonClimate, winter: SeasonClimate) => ({ spring, summer, autumn, winter })

type Base = Omit<DestinationInput, 'id' | 'image' | 'scope' | 'country' | 'visa_required' | 'enabled'>
/** مختصات مرکز شهر/محل مقصدها (۲ رقم اعشار). «کردستان» (استان) و «کویر مصر» نقطهٔ مشخصی ندارند و عمداً خالی‌اند. */
export const SEED_COORDINATES: Record<number, { name: string; latitude: number; longitude: number }> = {
  1: { name: 'یزد', latitude: 31.9, longitude: 54.36 },
  2: { name: 'اصفهان', latitude: 32.65, longitude: 51.67 },
  3: { name: 'شیراز', latitude: 29.59, longitude: 52.58 },
  4: { name: 'کاشان', latitude: 33.98, longitude: 51.44 },
  5: { name: 'کرمان', latitude: 30.28, longitude: 57.08 },
  6: { name: 'چابهار', latitude: 25.29, longitude: 60.64 },
  7: { name: 'هرمز', latitude: 27.06, longitude: 56.46 },
  8: { name: 'ماسوله', latitude: 37.16, longitude: 48.98 },
  9: { name: 'رامسر', latitude: 36.9, longitude: 50.66 },
  12: { name: 'ابیانه', latitude: 33.64, longitude: 51.59 },
  13: { name: 'استانبول', latitude: 41.01, longitude: 28.98 },
  14: { name: 'تفلیس', latitude: 41.72, longitude: 44.83 },
  15: { name: 'دبی', latitude: 25.2, longitude: 55.27 },
  16: { name: 'باکو', latitude: 40.41, longitude: 49.87 },
}
const make = (id: number, country: string, visa: boolean | null, b: Base): Destination =>
  withDerived({ id, ...(SEED_COORDINATES[id]?.name === b.name ? { latitude: SEED_COORDINATES[id].latitude, longitude: SEED_COORDINATES[id].longitude } : {}), country, scope: country === 'ایران' ? 'domestic' : 'international', visa_required: visa, image: `/images/destinations/${id}.svg`, enabled: true, ...b })

export const MOCK_DESTINATIONS: Destination[] = [
  make(1, 'ایران', null, { name: 'یزد', province_or_city: 'یزد', type: ['تاریخی', 'فرهنگی'], duration: '۲ تا ۳ روز', budget: 'متوسط', companions: ['زوج', 'دوستان', 'سفر انفرادی'], quality: 9, recommended_for: ['دوستداران معماری و تاریخ', 'عکاسان'], attractions: ['مسجد جامع یزد', 'بافت تاریخی شهر', 'باغ دولت‌آباد'], description: 'شهر خشت و بادگیر؛ کوچه‌های گلی، خانه‌های تاریخی و غروب‌های کویری که با یک قدم‌زدن آرام در بافت قدیم به یاد ماندنی می‌شوند.',
    season_suitability: seasons(c(E, 21, 12, 29, 'معتدل و آفتابی', L, L, 'روزهای ملایم برای قدم‌زدن در بافت تاریخی و شب‌های خنک.'), c(N, 33, 24, 41, 'بسیار گرم و خشک', L, L, 'گرمای شدید تابستان گردش در شهر را سخت می‌کند.'), c(E, 20, 10, 28, 'ملایم و خشک', L, L, 'آسمان صاف و هوای دلپذیر؛ بهترین زمان دیدن بناهای تاریخی.'), c(A, 8, 0, 15, 'سرد و خشک', L, L, 'روزهای آفتابی و شب‌های سرد؛ مناسب سفر کوتاه با لباس گرم.')) }),
  make(2, 'ایران', null, { name: 'اصفهان', province_or_city: 'اصفهان', type: ['تاریخی', 'فرهنگی', 'شهری'], duration: '۲ تا ۳ روز', budget: 'لوکس', companions: ['خانواده', 'زوج', 'دوستان'], quality: 9, recommended_for: ['دوستداران هنر و معماری', 'سفر خانوادگی'], attractions: ['میدان نقش جهان', 'سی‌وسه‌پل', 'مسجد شیخ لطف‌الله', 'کاخ چهلستون'], description: 'میدان‌ها، پل‌ها و باغ‌های تاریخی در قلب ایران؛ شهری که هر گوشه‌اش کاشی‌کاری و داستانی از دوران صفوی دارد.',
    season_suitability: seasons(c(E, 19, 11, 27, 'معتدل و بهاری', L, L, 'باغ‌ها پر از شکوفه و هوا برای پیاده‌روی کنار زاینده‌رود عالی است.'), c(A, 29, 20, 37, 'گرم و خشک', L, L, 'روزها گرم است؛ بهتر است گردش را به صبح و عصر موکول کنید.'), c(E, 17, 8, 25, 'خنک و آفتابی', L, L, 'رنگ‌های پاییزی چنار و هوای خنک، فصل ایده‌آل بازدید از بناها.'), c(A, 6, -2, 12, 'سرد با آسمان صاف', L, M, 'سرد اما کم‌شلوغ؛ مناسب بازدید از موزه‌ها و مساجد.')) }),
  make(3, 'ایران', null, { name: 'شیراز', province_or_city: 'فارس', type: ['تاریخی', 'فرهنگی', 'شهری'], duration: '۲ تا ۳ روز', budget: 'راحت', companions: ['خانواده', 'زوج', 'دوستان'], quality: 8.5, recommended_for: ['دوستداران شعر و تاریخ', 'سفر خانوادگی'], attractions: ['آرامگاه حافظ', 'باغ ارم', 'مسجد نصیرالملک', 'تخت جمشید (در نزدیکی)'], description: 'شهر باغ‌ها و شعر؛ از آرامگاه حافظ تا تخت جمشید، سفری میان تاریخ و عطر بهارنارنج.',
    season_suitability: seasons(c(E, 20, 12, 28, 'معتدل و عطرآگین', M, L, 'بهار شیراز با بوی بهارنارنج بهترین زمان سفر است.'), c(A, 31, 21, 39, 'گرم و خشک', L, L, 'تابستان گرم است؛ برنامهٔ بازدید را عصرها بگذارید.'), c(E, 19, 9, 27, 'ملایم و آفتابی', L, L, 'هوای دلپذیر برای بازدید از باغ‌ها و تخت جمشید.'), c(G, 10, 2, 16, 'خنک و گاه بارانی', M, M, 'زمستان ملایم‌تر از بیشتر شهرهای ایران و مناسب گردش شهری.')) }),
  make(4, 'ایران', null, { name: 'کاشان', province_or_city: 'اصفهان', type: ['تاریخی', 'فرهنگی'], duration: 'یک روزه', budget: 'اقتصادی', companions: ['خانواده', 'زوج', 'دوستان'], quality: 7, recommended_for: ['سفر کوتاه آخر هفته', 'علاقه‌مندان به خانه‌های تاریخی'], attractions: ['باغ فین', 'خانهٔ طباطبایی‌ها', 'خانهٔ بروجردی‌ها'], description: 'خانه‌های تاریخی با حیاط‌های آینه‌کاری‌شده و باغ فین؛ مقصدی دلنشین برای یک سفر کوتاه فرهنگی.',
    season_suitability: seasons(c(E, 22, 13, 31, 'معتدل و آفتابی', L, L, 'فصل گلاب‌گیری؛ هوا برای دیدن خانه‌ها مناسب است.'), c(N, 35, 25, 42, 'بسیار گرم و خشک', L, L, 'گرمای شدید، بازدید از خانه‌های تاریخی را دشوار می‌کند.'), c(E, 20, 10, 29, 'ملایم و خشک', L, L, 'هوای خنک و آسمان صاف؛ بهترین زمان قدم‌زدن در باغ فین.'), c(A, 9, 0, 15, 'سرد و خشک', L, L, 'سرد ولی آرام و کم‌ازدحام؛ مناسب بازدید از خانه‌ها.')) }),
  make(5, 'ایران', null, { name: 'کرمان', province_or_city: 'کرمان', type: ['تاریخی', 'کویر'], duration: '۴ تا ۷ روز', budget: 'متوسط', companions: ['دوستان', 'سفر انفرادی'], quality: 7, recommended_for: ['علاقه‌مندان به طبیعت کویری', 'دوستداران تاریخ'], attractions: ['مجموعهٔ گنجعلی‌خان', 'باغ شاهزادهٔ ماهان', 'کلوت‌های شهداد'], description: 'از بازار و باغ‌های تاریخی تا کلوت‌های شهداد و بیابان لوت؛ سفری گسترده میان شهر و کویر.',
    season_suitability: seasons(c(E, 19, 9, 27, 'معتدل و خشک', L, L, 'هوای مناسب برای شهر و کلوت‌های شهداد.'), c(A, 29, 17, 37, 'گرم و خشک', L, L, 'روزها گرم است؛ کلوت‌ها را صبح یا غروب ببینید.'), c(G, 17, 6, 26, 'خنک و آفتابی', L, L, 'پاییز خنک و دلپذیر برای گردش در شهر و اطراف.'), c(A, 6, -4, 13, 'سرد با شب‌های یخبندان', L, L, 'شب‌ها سرد است؛ برای کویر لباس گرم لازم است.')) }),
  make(6, 'ایران', null, { name: 'چابهار', province_or_city: 'سیستان و بلوچستان', type: ['ساحل', 'طبیعت'], duration: '۴ تا ۷ روز', budget: 'متوسط', companions: ['زوج', 'دوستان', 'سفر انفرادی'], quality: 7, recommended_for: ['دوستداران دریا و ساحل', 'سفر طولانی'], attractions: ['بندر تیس', 'کوه‌های مینیاتوری', 'ساحل‌های دریای عمان'], description: 'سواحل دریای عمان، کوه‌های مینیاتوری و فرهنگ بلوچی؛ سفری آفتابی در جنوب شرق ایران.',
    season_suitability: seasons(c(A, 29, 24, 34, 'گرم و مرطوب', L, H, 'هوا رو به گرم‌شدن است؛ مناسب سفر کوتاه کنار دریا.'), c(N, 33, 28, 38, 'بسیار گرم و شرجی', L, H, 'گرمای شرجی و شدید؛ سفر توصیه نمی‌شود.'), c(G, 28, 22, 34, 'گرم و مرطوب', L, H, 'دریا هنوز گرم است و هوا رو به خنک‌شدن.'), c(E, 22, 15, 28, 'ملایم و آفتابی', L, M, 'زمستان چابهار مثل بهار شمال است؛ عالی برای ساحل و دریا.')) }),
  make(7, 'ایران', null, { name: 'هرمز', province_or_city: 'هرمزگان', type: ['ساحل', 'ماجراجویی', 'طبیعت'], duration: '۲ تا ۳ روز', budget: 'اقتصادی', companions: ['زوج', 'دوستان', 'سفر انفرادی'], quality: 8, recommended_for: ['ماجراجویان', 'عکاسان'], attractions: ['ساحل سرخ', 'درهٔ رنگین‌کمان', 'قلعهٔ پرتغالی‌ها'], description: 'جزیرهٔ خاک‌های رنگی؛ ساحل سرخ، دره رنگین‌کمان و غروب‌های خلیج فارس.',
    season_suitability: seasons(c(A, 28, 22, 33, 'گرم و شرجی', L, H, 'گرمای ملایم؛ بازدید را به صبح و عصر محدود کنید.'), c(N, 35, 30, 41, 'بسیار گرم و شرجی', L, H, 'گرما و رطوبت زیاد؛ سفر توصیه نمی‌شود.'), c(G, 29, 23, 35, 'گرم و شرجی', L, H, 'هوا رو به ملایم‌شدن است؛ مناسب پیاده‌روی ساحلی.'), c(E, 21, 15, 26, 'ملایم و آفتابی', L, M, 'بهترین زمان دیدن ساحل سرخ و دره رنگین‌کمان.')) }),
  make(8, 'ایران', null, { name: 'ماسوله', province_or_city: 'گیلان', type: ['جنگل', 'کوهستان', 'طبیعت'], duration: 'یک روزه', budget: 'اقتصادی', companions: ['خانواده', 'زوج', 'دوستان'], quality: 8, recommended_for: ['دوستداران طبیعت', 'سفر کوتاه'], attractions: ['بافت پلکانی روستا', 'بازار سنتی', 'جنگل‌های اطراف'], description: 'روستای پلکانی میان جنگل و مه؛ جایی که پشت‌بام هر خانه، حیاط خانهٔ بالایی است.',
    season_suitability: seasons(c(G, 14, 8, 20, 'خنک و بارانی', H, H, 'سبز و پرآب؛ فقط چتر همراه داشته باشید.'), c(E, 22, 16, 28, 'خنک و مرطوب', M, H, 'پناهگاه خنک تابستان با هوای مه‌آلود.'), c(G, 14, 8, 19, 'خنک، مه‌آلود و بارانی', H, H, 'جنگل‌های رنگی پاییز؛ لباس گرم و ضدآب بپوشید.'), c(N, 3, -3, 8, 'سرد، برفی و لغزنده', H, H, 'برف و یخبندان رفت‌وآمد را دشوار می‌کند.')) }),
  make(9, 'ایران', null, { name: 'رامسر', province_or_city: 'مازندران', type: ['ساحل', 'جنگل', 'طبیعت'], duration: '۲ تا ۳ روز', budget: 'راحت', companions: ['خانواده', 'زوج'], quality: 7, recommended_for: ['سفر خانوادگی', 'دوستداران دریا و جنگل'], attractions: ['ساحل دریای خزر', 'تله‌کابین رامسر', 'کاخ‌موزهٔ رامسر'], description: 'شهری میان دریا و جنگل؛ تله‌کابین، کاخ‌موزه و ساحل خزر در یک سفر آرام.',
    season_suitability: seasons(c(G, 17, 11, 23, 'معتدل و بارانی', H, H, 'بهار سبز و بارانی؛ مناسب جنگل و ساحل.'), c(E, 27, 22, 32, 'گرم و مرطوب', M, H, 'دریا و جنگل برای فرار از گرمای شهرها.'), c(A, 18, 13, 22, 'خنک و بارانی', H, H, 'بارندگی زیاد است؛ برنامهٔ سفر را انعطاف‌پذیر بگیرید.'), c(N, 9, 4, 14, 'سرد و بسیار بارانی', H, H, 'باران پیوسته و هوای سرد، سفر را ناخوشایند می‌کند.')) }),
  make(10, 'ایران', null, { name: 'کردستان', province_or_city: 'کردستان', type: ['کوهستان', 'طبیعت', 'ماجراجویی', 'فرهنگی'], duration: 'بیش از یک هفته', budget: 'متوسط', companions: ['دوستان', 'سفر انفرادی'], quality: 7.5, recommended_for: ['کوهنوردان', 'علاقه‌مندان به فرهنگ محلی'], attractions: ['اورامانات', 'پالنگان', 'دریاچهٔ زریوار'], description: 'روستاهای کوهستانی، موسیقی و پوشش محلی؛ سفری میان کوه‌ها و دریاچه‌های غرب ایران.',
    season_suitability: seasons(c(E, 15, 8, 22, 'معتدل و سرسبز', M, M, 'دشت‌ها سبز و آبشارها پرآب است.'), c(E, 24, 14, 32, 'گرم در روز و خنک در شب', L, L, 'روزهای آفتابی و شب‌های خنک برای کوه و کمپ.'), c(A, 14, 4, 22, 'خنک و متغیر', M, M, 'هوا رو به سرد شدن است؛ لباس لایه‌ای ببرید.'), c(N, -3, -12, 4, 'بسیار سرد و برفی', M, M, 'سرمای شدید و برف سنگین مسیرها را مسدود می‌کند.')) }),
  make(11, 'ایران', null, { name: 'کویر مصر', province_or_city: 'اصفهان', type: ['کویر', 'ماجراجویی', 'طبیعت'], duration: '۲ تا ۳ روز', budget: 'متوسط', companions: ['زوج', 'دوستان'], quality: 8, recommended_for: ['شب‌گردان کویر', 'عکاسان آسمان شب'], attractions: ['شن‌زارها', 'آسمان پرستاره', 'شب‌مانی در کویر'], description: 'شن‌زارهای نرم، آسمان پرستاره و شب‌مانی در دل کویر نزدیک خور و بیابانک.',
    season_suitability: seasons(c(A, 24, 14, 33, 'رو به گرم و بادخیز', L, L, 'روزها رو به گرم‌شدن است؛ شب‌ها هنوز خنک.'), c(N, 38, 28, 46, 'گرمای شدید و خشک', L, L, 'گرمای بیش از تحمل؛ سفر توصیه نمی‌شود.'), c(E, 19, 7, 29, 'ملایم و صاف', L, L, 'روزهای ملایم و شب‌های خنک، ایده‌آل کویرگردی.'), c(E, 9, -2, 18, 'روز آفتابی و شب سرد', L, L, 'آسمان شفاف زمستان برای ستاره‌بینی بهترین است.')) }),
  make(12, 'ایران', null, { name: 'ابیانه', province_or_city: 'اصفهان', type: ['تاریخی', 'فرهنگی', 'کوهستان'], duration: 'یک روزه', budget: 'اقتصادی', companions: ['خانواده', 'زوج', 'سفر انفرادی'], quality: 7, recommended_for: ['دوستداران روستاهای تاریخی', 'عکاسان'], attractions: ['بافت سرخ‌رنگ روستا', 'پوشش سنتی مردم', 'کوچه‌های تاریخی'], description: 'روستای سرخ‌رنگ تاریخی در دامنهٔ کوه‌های کرکس با معماری و پوشش محلی زنده.',
    season_suitability: seasons(c(E, 13, 5, 20, 'خنک و دلپذیر', M, L, 'هوای بهاری و گل‌های دامنه‌ها.'), c(G, 22, 13, 30, 'معتدل و آفتابی', L, L, 'خنک‌تر از شهرهای اطراف؛ مناسب سفر یک‌روزه.'), c(E, 12, 3, 19, 'خنک و رنگارنگ', M, L, 'رنگ‌های پاییزی و هوای صاف.'), c(N, 1, -8, 7, 'سرد، برفی و یخبندان', M, L, 'برف و یخبندان مسیر را دشوار می‌کند.')) }),
  make(13, 'ترکیه', false, { name: 'استانبول', province_or_city: 'استانبول', type: ['تاریخی', 'فرهنگی', 'شهری'], duration: '۴ تا ۷ روز', budget: 'راحت', companions: ['خانواده', 'زوج', 'دوستان', 'سفر انفرادی'], quality: 9, recommended_for: ['دوستداران تاریخ و بازار', 'سفر خانوادگی'], attractions: ['ایاصوفیه', 'مسجد سلطان‌احمد', 'بازار بزرگ', 'کاخ توپکاپی'], description: 'شهری میان دو قاره؛ بازارها، مسجدها و مه تنگهٔ بسفر در یک سفر شهری فراموش‌نشدنی.',
    season_suitability: seasons(c(E, 14, 9, 19, 'معتدل و گاه بارانی', M, M, 'لاله‌ها و هوای ملایم؛ مناسب پیاده‌روی شهری.'), c(G, 25, 20, 30, 'گرم و شلوغ', L, M, 'گرم و پرجمعیت اما با دریا و شب‌های زنده.'), c(E, 16, 11, 22, 'خنک و دلپذیر', M, M, 'کم‌شلوغ‌تر و خنک؛ بهترین فصل بازدید.'), c(A, 8, 4, 11, 'سرد و بارانی', H, H, 'سرد و پربارندگی؛ مناسب بازدید از موزه‌ها.')) }),
  make(14, 'گرجستان', false, { name: 'تفلیس', province_or_city: 'تفلیس', type: ['شهری', 'تاریخی', 'فرهنگی'], duration: '۲ تا ۳ روز', budget: 'اقتصادی', companions: ['زوج', 'دوستان', 'سفر انفرادی'], quality: 7.5, recommended_for: ['سفر اقتصادی', 'دوستداران شهر قدیمی'], attractions: ['شهر قدیم', 'قلعهٔ ناریکالا', 'گرمابه‌های گوگردی'], description: 'پایتخت گرجستان با کوچه‌های سنگی، گرمابه‌های گوگردی و کافه‌های رنگارنگ.',
    season_suitability: seasons(c(E, 14, 8, 20, 'معتدل و بارانی', M, M, 'شهر سبز می‌شود؛ هوا برای گردش مناسب است.'), c(G, 25, 18, 33, 'گرم و آفتابی', L, M, 'گرم ولی خوش‌آب‌وهوا برای شب‌گردی.'), c(E, 14, 7, 20, 'خنک و رنگارنگ', M, M, 'تاکستان‌ها و برگ‌های پاییزی، فصل ایده‌آل.'), c(N, 3, -3, 8, 'سرد، برفی و مه‌آلود', M, H, 'سرمای شدید و برف؛ سفر شهری راحت نیست.')) }),
  make(15, 'امارات', true, { name: 'دبی', province_or_city: 'دبی', type: ['شهری', 'ساحل'], duration: '۲ تا ۳ روز', budget: 'لوکس', companions: ['خانواده', 'زوج', 'دوستان'], quality: 8, recommended_for: ['علاقه‌مندان به خرید و تفریح', 'سفر لوکس'], attractions: ['برج خلیفه', 'دبی‌مال', 'ساحل جمیرا', 'بازار طلا'], description: 'شهر آسمان‌خراش‌ها، ساحل و بازار؛ مقصدی مدرن در کنار خلیج فارس.',
    season_suitability: seasons(c(A, 28, 22, 35, 'گرم و آفتابی', L, M, 'رو به گرم‌شدن؛ فضاهای بسته و مراکز خرید راحت‌ترند.'), c(N, 38, 31, 45, 'گرمای شدید و شرجی', L, H, 'گرمای بسیار زیاد؛ سفر توصیه نمی‌شود.'), c(G, 29, 22, 36, 'گرم و آفتابی', L, M, 'هوا رو به ملایم‌شدن است.'), c(E, 20, 14, 26, 'ملایم و آفتابی', L, M, 'بهترین زمان ساحل و گردش در شهر.')) }),
  make(16, 'جمهوری آذربایجان', true, { name: 'باکو', province_or_city: 'باکو', type: ['شهری', 'ساحل', 'تاریخی'], duration: '۲ تا ۳ روز', budget: 'متوسط', companions: ['خانواده', 'زوج', 'دوستان'], quality: 7, recommended_for: ['سفر کوتاه شهری', 'دوستداران دریا و شهر قدیمی'], attractions: ['ایچری‌شهر', 'برج دختر', 'بلوار ساحلی'], description: 'شهر قدیمی ایچری‌شهر، برج دختر و بلوار ساحلی خزر؛ ترکیبی از باد و تاریخ.',
    season_suitability: seasons(c(G, 12, 6, 17, 'خنک و بادخیز', M, M, 'بهار خنک با بادهای ملایم.'), c(A, 26, 21, 31, 'گرم و شرجی', L, H, 'گرم و مرطوب؛ نزدیک دریا خنک‌تر است.'), c(G, 15, 10, 20, 'خنک و دلپذیر', M, M, 'هوای ملایم برای گردش ساحلی.'), c(A, 5, 1, 9, 'سرد و بادخیز', M, M, 'سرد و باد زیاد؛ مناسب سفر کوتاه شهری.')) }),
]

export const locationLabel = (d: Pick<Destination, 'name' | 'country' | 'province_or_city'>) => (d.province_or_city === d.name ? d.country : `${d.province_or_city}، ${d.country}`)
