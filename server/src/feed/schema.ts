import { z } from 'zod'

// «محتوای صفحهٔ اصلی»: کارت «آیا می‌دانستید» (صفحهٔ اول) و هشت موضوع کاشی صفحهٔ دوم.
// شناسه‌ها و عنوان‌ها باید با src/feed/topics.ts یکی باشند (تست server/tests/feed.test.ts این را بررسی می‌کند).
export const FEED_KINDS = ['dyk', 'mood', 'monthly', 'personal', 'week', 'calendar', 'mini', 'wishlist', 'discovery'] as const
export type FeedKind = (typeof FEED_KINDS)[number]

export interface TopicDef {
  title: string
  /** راهنمای تولید برای مدل: این موضوع چه نوع کارتی می‌خواهد */
  brief: string
  /** برچسب‌های «facts» که مدل باید (در صورت اطلاع قابل‌اتکا) پر کند */
  factLabels: string[]
  /** عبارت جست‌وجوی وب: فارسی (سایت‌های داخلی) و انگلیسی (سایت‌های خارجی). {month} {season} {hint} جایگزین می‌شود. */
  searchFa: string
  searchEn: string
}

export const TOPICS: Record<FeedKind, TopicDef> = {
  dyk: {
    title: 'آیا می‌دانستید',
    brief: 'یک نکتهٔ شگفت‌انگیز، واقعی و دقیق دربارهٔ سفر، یک مقصد، فرهنگ یا طبیعت مقصد (داخلی یا خارجی). متن مستقیماً با خود نکته شروع شود و عبارت «آیا می‌دانستید» را ننویس (برنامه خودش اضافه می‌کند). عنوان کوتاه نام همان مقصد/موضوع است.',
    factLabels: [],
    searchFa: 'نکات جالب و کمتر شنیده شده سفر و گردشگری {hint}',
    searchEn: 'surprising interesting travel facts about destinations {hint}',
  },
  mood: {
    title: 'حال‌وهوای امروز',
    brief: 'یک جملهٔ کوتاه و گرم متناسب با فصل و حال‌وهوای همین روزها که کاربر را به سفر دعوت کند (مثل «پاییز رسیده؛ وقت جنگل‌گردیه 🍂»). عنوان همان جمله است؛ متن کامل ۲ تا ۳ جمله توضیح دربارهٔ اینکه چرا الان وقت این سفر است.',
    factLabels: ['بهترین مقصد این روزها'],
    searchFa: 'سفر در {month} ماه {season} جاذبه‌های گردشگری {hint}',
    searchEn: 'best places to travel in {season} Iran and nearby {hint}',
  },
  monthly: {
    title: 'این ماه وقت کجاست؟',
    brief: 'یک مقصد که در ماه جاری جذاب‌تر از بقیهٔ سال است. facts حتماً شامل «بهترین زمان بازدید»، «هزینهٔ تقریبی» و «مدت سفر» باشد (فقط اگر مطمئنی؛ عدد حدسی ننویس).',
    factLabels: ['بهترین زمان بازدید', 'هزینهٔ تقریبی', 'مدت سفر'],
    searchFa: 'بهترین مقصدهای سفر در {month} ماه {hint}',
    searchEn: 'best destinations to visit in {season} {hint}',
  },
  personal: {
    title: 'پیشنهاد مخصوص تو',
    brief: 'یک کارت پیشنهاد شخصی‌سازی‌نما با لحن صمیمی؛ مثل «۳ مقصد اقتصادی برای سفر دونفره»، «فکر می‌کنیم عاشق این جنگل بشی!» یا «مقصدهایی که هنوز ندیدی». متن می‌تواند فهرست کوتاهی از مقصدهای مشخص با یک دلیل برای هرکدام باشد.',
    factLabels: ['مناسب برای'],
    searchFa: 'مقصدهای اقتصادی و پیشنهادی سفر {hint}',
    searchEn: 'budget friendly travel destinations recommendations {hint}',
  },
  week: {
    title: 'این هفته کجا بریم؟',
    brief: 'یک پیشنهاد آمادهٔ سفر برای همین هفته که یکی از این حالت‌ها باشد: سفر یک‌روزه، آخر هفته، سفر اقتصادی یا سفر خانوادگی (نوع را در facts با برچسب «نوع سفر» بنویس). facts باید «مدت سفر»، «هزینه»، «مسیر» و «جاذبه‌های اطراف» را (در صورت اطلاع قابل‌اتکا) داشته باشد.',
    factLabels: ['نوع سفر', 'مدت سفر', 'هزینه', 'مسیر', 'جاذبه‌های اطراف'],
    searchFa: 'سفر یک‌روزه و آخر هفته {month} ماه مسیر هزینه جاذبه‌ها {hint}',
    searchEn: 'weekend getaway day trip ideas route cost {hint}',
  },
  calendar: {
    title: 'تقویمی که برای سفر زندگی می‌کند',
    brief: 'یک فرصت سفری مرتبط با یک مناسبت یا بازهٔ زمانی مشخص: تعطیلات رسمی، مناسبت محلی، زمان شکوفه‌ها یا پاییزگردی، جشنواره یا رویداد گردشگری. facts شامل «زمان» (روز/ماه یا بازه) و «مناسبت» باشد. فقط رویدادهایی بنویس که در منابع تأیید شده‌اند؛ تاریخ حدسی نده.',
    factLabels: ['زمان', 'مناسبت'],
    searchFa: 'جشنواره‌ها و رویدادهای گردشگری {month} ماه تعطیلات مناسبت‌های محلی {hint}',
    searchEn: 'travel festivals events calendar {season} Iran {hint}',
  },
  mini: {
    title: 'سفرهای کوچک، خاطره‌های بزرگ',
    brief: 'یک ایدهٔ سفر کوچک که نیاز به تعطیلات طولانی ندارد: مقصد نزدیک برای یک روز آزاد، یک شب کمپ زیر ستاره‌ها، روستای ناشناخته یا سفر با بودجهٔ محدود.',
    factLabels: ['مدت سفر', 'هزینهٔ تقریبی'],
    searchFa: 'سفر کوتاه یک‌روزه کمپ شبانه روستای کمتر شناخته‌شده بودجه کم {hint}',
    searchEn: 'short trip one day escape camping hidden village low budget {hint}',
  },
  wishlist: {
    title: 'لیست آرزوهای سفر من',
    brief: 'یک ایدهٔ «باید ببینمش» برای لیست آرزوها، با قاب زمانی دلخواه (مثل «جاهایی که باید قبل از پایان پاییز ببینم»). مقصد مشخص و دلیل ارزش دیدنش را بگو.',
    factLabels: ['بهترین زمان'],
    searchFa: 'مقصدهایی که باید یک بار در عمر دید {hint}',
    searchEn: 'bucket list travel destinations must see {hint}',
  },
  discovery: {
    title: 'هر روز یک کشف تازه',
    brief: 'یک مقصد، مسیر یا جاذبهٔ کمتر شناخته‌شده؛ لحن کشف و شگفتی («احتمالاً این روستای زیبا رو نمی‌شناسی»). مقصد مشهورِ تکراری نباش.',
    factLabels: ['موقعیت', 'بهترین زمان'],
    searchFa: 'جاذبه‌های کمتر شناخته‌شده و روستاهای ناشناخته ایران {hint}',
    searchEn: 'hidden gems lesser known places off the beaten path {hint}',
  },
}

const text = (max: number) => z.string().trim().max(max)

export const feedContentSchema = z.object({
  title: text(90).min(1),
  /** متن کامل (پاپ‌آپ)؛ ابتدای همین متن روی کاشی نمایش داده می‌شود */
  body: text(1200).min(1),
  place: text(80).optional(),
  facts: z.array(z.object({ label: text(30).min(1), value: text(120).min(1) })).max(6).default([]),
  /** عبارت‌های جست‌وجوی تصویر (ترجیحاً انگلیسی، با نام مکان) */
  image_queries: z.array(text(120).min(1)).max(4).default([]),
})
export type FeedContent = z.infer<typeof feedContentSchema>

/** خروجی مدل: محتوا + شمارهٔ منابعِ استفاده‌شده (از فهرست شمارهٔ ۱ به بعد) */
export const feedGenSchema = feedContentSchema.extend({ source_refs: z.array(z.number().int().min(1)).max(8).default([]) })

export const FEED_STATUSES = ['draft', 'queued', 'published', 'rejected'] as const
export type FeedStatus = (typeof FEED_STATUSES)[number]
export const FEED_TRANSITIONS: Record<FeedStatus, FeedStatus[]> = {
  draft: ['queued', 'rejected'],
  queued: ['draft', 'published'],
  published: ['draft'], // لغو انتشار
  rejected: ['draft'],
}
export const canFeedTransition = (from: FeedStatus, to: FeedStatus) => FEED_TRANSITIONS[from].includes(to)

export interface FeedSource { title: string; url: string }
export interface FeedImage {
  id: number; url: string; thumb_url: string | null; provider: string
  source_url: string | null; author: string | null; license: string | null; license_url: string | null; attribution: string | null
}
export interface FeedItem {
  id: number; kind: FeedKind; status: FeedStatus; source: 'ai' | 'manual'
  content: FeedContent; sources: FeedSource[]; images: FeedImage[]
  cover_image_id: number | null
  /** true = تصویر اصلی را هوش مصنوعی انتخاب کرده و هنوز مدیر تغییرش نداده */
  cover_auto: boolean
  ai_meta: { model?: string; used_fallback?: boolean; generated_at?: string; warnings: string[] } | null
  reject_reason: string | null
  created_at: string; updated_at: string
  queued_at: string | null; published_at: string | null
  /** تاریخ انتشار به وقت تهران (YYYY-MM-DD) */
  published_date: string | null
}

export const sourceInput = z.object({ title: text(160).min(1), url: z.string().trim().max(2000).refine((u) => /^https?:\/\//i.test(u), 'نشانی منبع باید با http یا https شروع شود.') })

export const normTitle = (s: string) => s.replace(/[\s‌‌‏.,،؛:!?؟"'«»()\-–—]+/g, ' ').trim().toLowerCase()

/** تاریخ امروز به وقت تهران: YYYY-MM-DD */
export function tehranDate(d: Date): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('year')}-${g('month')}-${g('day')}`
}

const MONTHS_FA = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const SEASONS_FA = ['بهار', 'تابستان', 'پاییز', 'زمستان']
/** ماه و فصل شمسی جاری (برای پرامپت و عبارت جست‌وجو) */
export function jalaliContext(d: Date): { month: string; season: string; day: number } {
  const p = new Intl.DateTimeFormat('en-u-ca-persian', { timeZone: 'Asia/Tehran', month: 'numeric', day: 'numeric' }).formatToParts(d)
  const month = Number(p.find((x) => x.type === 'month')?.value) || 1, day = Number(p.find((x) => x.type === 'day')?.value) || 1
  return { month: MONTHS_FA[month - 1] ?? '', season: SEASONS_FA[Math.floor((month - 1) / 3)] ?? '', day }
}
