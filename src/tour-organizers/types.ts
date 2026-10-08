// برگزارکنندهٔ تور؛ کاملاً مستقل از مقصد و پیشنهاد سفر.
export interface TourOrganizer {
  id: number
  name: string
  /** مسیر یا نشانی تصویر لوگو (اختیاری) */
  logo: string
  description: string
  city: string
  phone: string
  website: string
  instagram: string
  active: boolean
}
