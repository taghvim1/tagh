// تبدیل «محتوای پیشنهاد» سرور (قالب JSON هوش مصنوعی) ↔ مقصد برنامه. مشترک بین برنامهٔ کاربر و پنل مدیریت.
import { withDerived, type Destination, type Level, type Rating, type SeasonClimate, type SeasonKey } from '../data/destinations'
import { SEASONS } from './season'

export interface SeasonContent { rating: Rating; average_temperature: number; temperature_min: number; temperature_max: number; weather_condition: string; rainfall: Level; humidity: Level; priority: number; description: string }
export interface SuggestionContent {
  name: string; country: string; province_or_city: string; scope: 'domestic' | 'international'; type: Destination['type']; description: string
  duration: Destination['duration']; budget: Destination['budget']; companions: Destination['companions']; recommended_for: string[]; attractions: string[]
  visa_required: boolean | null; quality: number; latitude?: number; longitude?: number; image_query?: string
  seasons: Record<SeasonKey, SeasonContent>
}
export interface PublicSuggestion { id: number; version: number; content: SuggestionContent; image: { url: string; attribution: string | null; license: string | null }; images?: { url: string; attribution: string | null; license: string | null }[] }

/** شناسهٔ مقصدهای سرور از ۱۰۰۰ شروع می‌شود تا با مقصدهای محلی (seed/ادمین) تداخل نکند */
export const REMOTE_ID_BASE = 1000

export function contentToDestination(c: SuggestionContent, id: number, image = '', credit?: string, images?: { url: string; credit?: string }[]): Destination {
  return withDerived({
    id, name: c.name, country: c.country, province_or_city: c.province_or_city, scope: c.scope, type: c.type, description: c.description, image,
    season_suitability: Object.fromEntries(SEASONS.map((s) => [s.id, { ...c.seasons[s.id] } as SeasonClimate])) as Record<SeasonKey, SeasonClimate>,
    duration: c.duration, budget: c.budget, companions: c.companions, recommended_for: c.recommended_for, attractions: c.attractions,
    visa_required: c.scope === 'domestic' ? null : c.visa_required ?? false, quality: c.quality, enabled: true,
    ...(c.latitude !== undefined && c.longitude !== undefined ? { latitude: c.latitude, longitude: c.longitude } : {}),
    ...(credit ? { image_credit: credit } : {}),
    ...(images && images.length > 1 ? { images } : {}),
  })
}

export function destinationToContent(d: Destination, imageQuery?: string): SuggestionContent {
  return {
    name: d.name, country: d.country, province_or_city: d.province_or_city, scope: d.scope, type: d.type, description: d.description,
    duration: d.duration, budget: d.budget, companions: d.companions, recommended_for: d.recommended_for, attractions: d.attractions,
    visa_required: d.scope === 'domestic' ? null : d.visa_required ?? false, quality: d.quality,
    ...(d.latitude !== undefined && d.longitude !== undefined ? { latitude: d.latitude, longitude: d.longitude } : {}),
    ...(imageQuery ? { image_query: imageQuery } : {}),
    seasons: Object.fromEntries(SEASONS.map((s) => [s.id, { ...d.season_suitability[s.id] }])) as Record<SeasonKey, SeasonContent>,
  }
}
