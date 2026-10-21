import { z } from 'zod'

export const BUDGETS = ['اقتصادی', 'متوسط', 'لوکس'] as const
export const VEHICLES = ['خودروی شخصی', 'اتوبوس', 'قطار', 'هواپیما', 'کشتی یا لنج'] as const
export const TRIP_TYPES = ['خانوادگی', 'زوج و ماه‌عسل', 'دوستانه', 'تک‌نفره', 'طبیعت‌گردی', 'فرهنگی و تاریخی', 'ماجراجویی', 'زیارتی', 'خرید', 'ساحلی و تفریحی'] as const

const place = z.string().trim().min(2).max(60)
export const packageInput = z.object({
  origin: place, destination: place,
  budget: z.enum(BUDGETS), amount_toman: z.number().int().min(100_000).max(10_000_000_000).optional(),
  vehicle: z.enum(VEHICLES), trip_type: z.enum(TRIP_TYPES), days: z.number().int().min(1).max(30),
})
export type PackageInput = z.infer<typeof packageInput>

const str = (n: number) => z.string().trim().min(1).max(n)
const list = (n: number, m: number) => z.array(str(m)).max(n)
export const packageContent = z.object({
  title: str(120), summary: str(700),
  best_season: str(200).optional(),
  transport: str(600),
  days: z.array(z.object({ day: z.number().int().min(1).max(30), title: str(120), plan: list(8, 300).min(1), stay: str(200).optional(), food: str(200).optional() })).min(1).max(30),
  cost: z.object({ total: str(200), breakdown: list(8, 200).default([]) }),
  tips: list(10, 300).min(1),
  warnings: list(6, 300).default([]),
  image_query: str(120),
})
export type PackageContent = z.infer<typeof packageContent>

export interface PackageImage { url: string; attribution: string | null; source_url: string | null; license: string | null }
export interface TourPackage { id: string; input: PackageInput; content: PackageContent; image: PackageImage | null; sources: { title: string; url: string }[]; generated_at: string }
