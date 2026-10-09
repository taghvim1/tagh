// تبدیل مقصد ↔ فرم (رشته‌ها) و اعتبارسنجی؛ خروجی با withDerived فیلدهای مشتق را دوباره محاسبه می‌کند.
import { COMPANIONS, TRAVEL_TYPES, withDerived, type Destination, type Level, type Rating, type SeasonClimate, type SeasonKey } from '../data/destinations'
import { SEASONS } from '../travel/season'
import { lines, num } from './components/fields'

export interface SeasonDraft { rating: Rating; average_temperature: string; temperature_min: string; temperature_max: string; weather_condition: string; rainfall: Level; humidity: Level; priority: string; description: string }
export interface DestinationDraft {
  name: string; country: string; province_or_city: string; scope: 'domestic' | 'international'; type: string[]; image: string; description: string
  duration: Destination['duration']; budget: Destination['budget']; companions: string[]; recommended_for: string; attractions: string
  visa: 'null' | 'true' | 'false'; quality: string; enabled: boolean; latitude: string; longitude: string; seasons: Record<SeasonKey, SeasonDraft>
}

const blankSeason = (): SeasonDraft => ({ rating: 'acceptable', average_temperature: '20', temperature_min: '10', temperature_max: '30', weather_condition: '', rainfall: 'low', humidity: 'low', priority: '0', description: '' })
const seasonToDraft = (c: SeasonClimate): SeasonDraft => ({ ...c, average_temperature: String(c.average_temperature), temperature_min: String(c.temperature_min), temperature_max: String(c.temperature_max), priority: String(c.priority) })

export function toDraft(d?: Destination): DestinationDraft {
  const seasons = Object.fromEntries(SEASONS.map((s) => [s.id, d ? seasonToDraft(d.season_suitability[s.id]) : blankSeason()])) as Record<SeasonKey, SeasonDraft>
  return d
    ? { name: d.name, country: d.country, province_or_city: d.province_or_city, scope: d.scope, type: d.type, image: d.image, description: d.description, duration: d.duration, budget: d.budget, companions: d.companions, recommended_for: d.recommended_for.join('\n'), attractions: d.attractions.join('\n'), visa: d.visa_required === null ? 'null' : d.visa_required ? 'true' : 'false', quality: String(d.quality), enabled: d.enabled, latitude: d.latitude === undefined ? '' : String(d.latitude), longitude: d.longitude === undefined ? '' : String(d.longitude), seasons }
    : { name: '', country: 'ایران', province_or_city: '', scope: 'domestic', type: [], image: '', description: '', duration: '۲ تا ۳ روز', budget: 'متوسط', companions: [], recommended_for: '', attractions: '', visa: 'null', quality: '7', enabled: true, latitude: '', longitude: '', seasons }
}

export type DraftResult = { ok: true; value: Destination } | { ok: false; errors: string[] }

export function fromDraft(f: DestinationDraft, id: number): DraftResult {
  const errors: string[] = []
  if (!f.name.trim()) errors.push('نام مقصد الزامی است.')
  if (!f.country.trim()) errors.push('کشور الزامی است.')
  if (!f.province_or_city.trim()) errors.push('استان یا شهر الزامی است.')
  if (!f.description.trim()) errors.push('توضیحات الزامی است.')
  if (f.type.length === 0) errors.push('حداقل یک نوع مقصد انتخاب کنید.')
  const [lat, lon] = [f.latitude.trim() === '' ? undefined : Number(f.latitude), f.longitude.trim() === '' ? undefined : Number(f.longitude)]
  if ((lat === undefined) !== (lon === undefined)) errors.push('عرض و طول جغرافیایی را با هم وارد کنید یا هر دو را خالی بگذارید.')
  else if (lat !== undefined && lon !== undefined && (!(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180))) errors.push('مختصات معتبر نیست (عرض ±۹۰، طول ±۱۸۰).')
  const quality = num(f.quality)
  if (Number.isNaN(quality) || quality < 0 || quality > 10) errors.push('کیفیت باید عددی بین ۰ تا ۱۰ باشد.')

  const season_suitability = {} as Record<SeasonKey, SeasonClimate>
  for (const s of SEASONS) {
    const x = f.seasons[s.id]
    const [avg, min, max, priority] = [num(x.average_temperature), num(x.temperature_min), num(x.temperature_max), num(x.priority)]
    if ([avg, min, max, priority].some(Number.isNaN)) errors.push(`${s.title}: دما و اولویت باید عدد باشند.`)
    else if (!(min <= avg && avg <= max)) errors.push(`${s.title}: باید حداقل دما ≤ میانگین ≤ حداکثر دما باشد.`)
    season_suitability[s.id] = { rating: x.rating, average_temperature: avg, temperature_min: min, temperature_max: max, weather_condition: x.weather_condition.trim(), rainfall: x.rainfall, humidity: x.humidity, priority, description: x.description.trim() }
  }
  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    value: withDerived({
      id, name: f.name.trim(), country: f.country.trim(), province_or_city: f.province_or_city.trim(), scope: f.scope,
      type: f.type.filter((t): t is (typeof TRAVEL_TYPES)[number] => (TRAVEL_TYPES as readonly string[]).includes(t)),
      description: f.description.trim(), image: f.image.trim() || `/images/destinations/${id <= 16 ? id : 1}.svg`, season_suitability,
      duration: f.duration, budget: f.budget, companions: f.companions.filter((c): c is (typeof COMPANIONS)[number] => (COMPANIONS as readonly string[]).includes(c)),
      recommended_for: lines(f.recommended_for), attractions: lines(f.attractions),
      visa_required: f.scope === 'domestic' ? null : f.visa === 'null' ? false : f.visa === 'true', quality, enabled: f.enabled, ...(lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : {}),
    }),
  }
}
