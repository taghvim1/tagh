import { z } from 'zod'
import { TRAVEL_TYPES } from '../domain/schema.js'

export const BUDGETS = ['اقتصادی', 'متوسط', 'لوکس'] as const
export const VEHICLES = ['خودروی شخصی', 'اتوبوس', 'قطار', 'هواپیما', 'کشتی یا لنج'] as const
/** همان دسته‌بندی «نوع مقصد» که در بخش پیشنهادهای سفر و پنل استفاده می‌شود */
export const TRIP_TYPES = TRAVEL_TYPES

const place = z.string().trim().min(2).max(60)
export const packageInput = z.object({
  origin: place, destination: place,
  budget: z.enum(BUDGETS), amount_toman: z.number().int().min(100_000).max(10_000_000_000).optional(),
  vehicle: z.enum(VEHICLES), trip_type: z.enum(TRIP_TYPES), days: z.number().int().min(1).max(30),
})
export type PackageInput = z.infer<typeof packageInput>

const str = (n: number) => z.string().trim().min(1).max(n)
const toman = z.number().int().min(0).max(10_000_000_000)
/** خروجی خام مدل؛ جمع هزینه را سرور خودش حساب می‌کند (مدل جمع نمی‌زند) */
export const modelOutput = z.object({
  title: str(80), summary: str(300),
  best_season: str(100).optional(),
  transport: str(220),
  days: z.array(z.object({ day: z.number().int().min(1).max(30), title: str(60), plan: z.array(str(110)).min(1).max(4) })).min(1).max(30),
  cost: z.object({
    items: z.array(z.object({ label: str(40), min: toman, max: toman, estimated: z.boolean().default(false) }).refine((x) => x.min <= x.max, 'min باید ≤ max باشد')).min(1).max(8),
    note: str(200).optional(),
  }),
  tips: z.array(str(200)).min(1).max(8),
  warnings: z.array(str(200)).max(5).default([]),
  image_query: str(120),
})
export type ModelOutput = z.infer<typeof modelOutput>

export interface PackageContent extends Omit<ModelOutput, 'cost'> { cost: ModelOutput['cost'] & { total_min: number; total_max: number } }
export interface PackageImage { url: string; attribution: string | null; source_url: string | null; license: string | null }
export interface BookingSite { name: string; url: string; note: string }
export interface TourPackage { id: string; input: PackageInput; content: PackageContent; images: PackageImage[]; booking: BookingSite[]; generated_at: string }
