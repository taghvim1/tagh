export interface PackageInput { origin: string; destination: string; budget: string; amount_toman?: number; vehicle: string; trip_type: string; days: number }
export interface PackageDay { day: number; title: string; plan: string[]; stay?: string; food?: string }
export interface PackageContent {
  title: string; summary: string; best_season?: string; transport: string; days: PackageDay[]
  cost: { total: string; breakdown: string[] }; tips: string[]; warnings: string[]; image_query: string
}
export interface PackageImage { url: string; attribution: string | null; source_url: string | null; license: string | null }
export interface TourPackage { id: string; input: PackageInput; content: PackageContent; image: PackageImage | null; sources: { title: string; url: string }[]; generated_at: string }
