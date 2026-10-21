export interface PackageInput { origin: string; destination: string; budget: string; amount_toman?: number; vehicle: string; trip_type: string; days: number }
export interface PackageDay { day: number; title: string; plan: string[]; stay?: string; food?: string }
export interface CostItem { label: string; min: number; max: number; estimated?: boolean }
export interface PackageContent {
  title: string; summary: string; best_season?: string; transport: string; days: PackageDay[]
  /** جدید: items + total_min/max. نسخهٔ قدیمی (پکیج‌های ذخیره‌شده): total (متن) + breakdown */
  cost: { items?: CostItem[]; total_min?: number; total_max?: number; note?: string; total?: string; breakdown?: string[] }
  tips: string[]; warnings: string[]; image_query: string
}
export interface PackageImage { url: string; attribution: string | null; source_url: string | null; license: string | null }
export interface BookingSite { name: string; url: string; note: string }
export interface TourPackage {
  id: string; input: PackageInput; content: PackageContent; generated_at: string
  images?: PackageImage[]; booking?: BookingSite[]
  /** فقط پکیج‌های قدیمیِ ذخیره‌شده */
  image?: PackageImage | null; sources?: { title: string; url: string }[]
}
export const imagesOf = (p: TourPackage): PackageImage[] => (p.images?.length ? p.images : p.image ? [p.image] : [])
