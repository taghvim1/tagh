import { z } from 'zod'

// فهرست‌ها باید با src/data/destinations.ts یکی باشند (تست server/tests/drift.test.ts این را بررسی می‌کند).
export const TRAVEL_TYPES = ['طبیعت', 'جنگل', 'ساحل', 'کویر', 'کوهستان', 'تاریخی', 'فرهنگی', 'ماجراجویی', 'شهری'] as const
export const COMPANIONS = ['خانواده', 'زوج', 'دوستان', 'سفر انفرادی'] as const
export const DURATIONS = ['یک روزه', '۲ تا ۳ روز', '۴ تا ۷ روز', 'بیش از یک هفته'] as const
export const BUDGETS = ['اقتصادی', 'متوسط', 'راحت', 'لوکس'] as const
export const RATINGS = ['excellent', 'good', 'acceptable', 'not_recommended'] as const
export const LEVELS = ['low', 'medium', 'high'] as const
export const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'] as const

const numish = z.preprocess((v) => (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : v), z.number().finite())
const text = (max: number) => z.string().trim().max(max)
const list = (max: number, itemMax: number) => z.array(z.string().trim().min(1).max(itemMax)).max(max)

const seasonSchema = z.object({
  rating: z.enum(RATINGS),
  average_temperature: numish, temperature_min: numish, temperature_max: numish,
  weather_condition: text(200), rainfall: z.enum(LEVELS), humidity: z.enum(LEVELS),
  priority: numish.default(0), description: text(500),
}).refine((s) => s.temperature_min <= s.average_temperature && s.average_temperature <= s.temperature_max, { message: 'باید حداقل دما ≤ میانگین ≤ حداکثر دما باشد.' })

/** محتوای یک پیشنهاد سفر (قالب JSON که هوش مصنوعی هم باید دقیقاً همین را تولید کند) */
export const contentSchema = z.object({
  name: text(80).min(1), country: text(60).min(1), province_or_city: text(80).min(1),
  scope: z.enum(['domestic', 'international']),
  type: z.array(z.enum(TRAVEL_TYPES)).min(1),
  description: text(1200).min(1),
  duration: z.enum(DURATIONS), budget: z.enum(BUDGETS),
  companions: z.array(z.enum(COMPANIONS)),
  recommended_for: list(10, 120), attractions: list(15, 120),
  visa_required: z.boolean().nullable().default(null),
  quality: numish.pipe(z.number().min(0).max(10)).default(7),
  latitude: numish.pipe(z.number().min(-90).max(90)).nullish().transform((v) => v ?? undefined),
  longitude: numish.pipe(z.number().min(-180).max(180)).nullish().transform((v) => v ?? undefined),
  image_query: text(120).optional(),
  /** چند عبارت جست‌وجوی تصویر با زاویه‌های متفاوت (جاذبه، معماری، بازار، فرهنگ، طبیعت) */
  image_queries: z.array(text(120)).max(6).optional(),
  seasons: z.object({ spring: seasonSchema, summer: seasonSchema, autumn: seasonSchema, winter: seasonSchema }),
}).refine((c) => (c.latitude === undefined) === (c.longitude === undefined), { message: 'عرض و طول جغرافیایی باید با هم وارد شوند یا هر دو خالی باشند.', path: ['latitude'] })
export type SuggestionContent = z.infer<typeof contentSchema>

export const issuesOf = (e: z.ZodError): string[] => e.issues.map((i) => `${i.path.join('.') || 'content'}: ${i.message}`)

// ---- وضعیت‌ها و انتقال‌ها ----
export const STATUSES = ['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'] as const
export type Status = (typeof STATUSES)[number]
export const TRANSITIONS: Record<Status, Status[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['approved', 'rejected', 'draft'],
  approved: ['published', 'draft', 'archived'],
  published: ['approved', 'archived'], // «approved» = لغو انتشار
  rejected: ['draft', 'archived'],
  archived: ['draft'],
}
export const canTransition = (from: Status, to: Status) => TRANSITIONS[from].includes(to)

export const dupKey = (name: string, country: string) => `${name.trim().replace(/\s+/g, ' ')}|${country.trim()}`.toLowerCase()
