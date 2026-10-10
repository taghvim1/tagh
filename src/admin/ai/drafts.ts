// پیش‌نویس پیشنهادهای سفرِ تولیدشده با هوش مصنوعی: قالب JSON، پرومپت، اعتبارسنجی و تأیید دستی.
// هیچ پیش‌نویسی تا تأیید مدیر در «پیشنهاد سفر» کاربران دیده نمی‌شود.
import { BUDGETS, COMPANIONS, DURATIONS, LEVEL_LABEL, RATING_LABEL, TRAVEL_TYPES, type Destination, type Level, type Rating } from '../../data/destinations'
import { createLocalRepository } from '../../lib/localRepository'
import { SEASONS } from '../../travel/season'
import { fromDraft, toDraft } from '../destinationDraft'

export interface AiDraftRecord {
  id: number
  status: 'draft' | 'approved' | 'rejected'
  source: 'import' | 'api'
  created_at: string
  /** مقصد کامل (قابل ویرایش، از جمله تصویر)؛ id واقعی هنگام تأیید تعیین می‌شود */
  destination: Destination
  image_query?: string
  publishedId?: number
}

/** محل ذخیره: فقط localStorage مرورگر مدیر (تا ایجاد API امن). */
export const draftRepo = createLocalRepository<AiDraftRecord>('taghvim-ai-drafts-v1', () => [])

const RATINGS = Object.keys(RATING_LABEL) as Rating[]
const LEVELS = Object.keys(LEVEL_LABEL) as Level[]
const isHttpOrPath = (s: string) => /^(https?:\/\/|\/|data:image\/)/i.test(s)

export type ParsedItem = { destination: Destination; image_query?: string }
export type ParseResult = { items: ParsedItem[]; errors: string[] }

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])
const unknownOf = (vals: string[], allowed: readonly string[]) => vals.filter((v) => !allowed.includes(v))

/** متن خروجی هوش مصنوعی (آرایهٔ JSON یا {destinations:[…]}، با یا بدون ```) → مقصدهای معتبر + خطاهای فارسی */
export function parseAiDestinations(text: string, firstId: number): ParseResult {
  const errors: string[] = []
  let data: unknown
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { return { items: [], errors: ['متن، JSON معتبر نیست.'] } }
  const list = Array.isArray(data) ? data : (data as { destinations?: unknown })?.destinations
  if (!Array.isArray(list) || list.length === 0) return { items: [], errors: ['آرایهٔ مقصدها پیدا نشد (باید آرایه یا {"destinations": [...]} باشد).'] }

  const items: ParsedItem[] = []
  list.forEach((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>
    const label = `مورد ${i + 1}${o.name ? ` (${str(o.name)})` : ''}`
    const errs: string[] = []
    const type = arr(o.type), companions = arr(o.companions)
    const bad = (what: string, v: string[]) => v.length && errs.push(`${what} نامعتبر: ${v.join('، ')}`)
    bad('نوع سفر', unknownOf(type, TRAVEL_TYPES)); bad('همراهان', unknownOf(companions, COMPANIONS))
    if (!(BUDGETS as readonly string[]).includes(str(o.budget))) errs.push(`بودجه باید یکی از ${BUDGETS.join('، ')} باشد.`)
    if (!(DURATIONS as readonly string[]).includes(str(o.duration))) errs.push(`مدت باید یکی از ${DURATIONS.join('، ')} باشد.`)
    if (o.scope !== 'domestic' && o.scope !== 'international') errs.push('scope باید domestic یا international باشد.')

    const d = toDraft()
    Object.assign(d, { name: str(o.name), country: str(o.country), province_or_city: str(o.province_or_city), scope: o.scope === 'international' ? 'international' : 'domestic', type, description: str(o.description),
      duration: str(o.duration) as Destination['duration'], budget: str(o.budget) as Destination['budget'], companions, recommended_for: arr(o.recommended_for).join('\n'), attractions: arr(o.attractions).join('\n'),
      visa: o.visa_required === true ? 'true' : o.visa_required === false ? 'false' : 'null', quality: str(o.quality ?? '7'),
      latitude: o.latitude == null ? '' : str(o.latitude), longitude: o.longitude == null ? '' : str(o.longitude),
      image: typeof o.image_url === 'string' && isHttpOrPath(o.image_url) ? o.image_url : '', enabled: true })
    const seasons = (o.seasons ?? {}) as Record<string, Record<string, unknown>>
    for (const s of SEASONS) {
      const x = seasons[s.id]
      if (!x) { errs.push(`فصل ${s.title} (${s.id}) وجود ندارد.`); continue }
      if (!RATINGS.includes(x.rating as Rating)) errs.push(`${s.title}: rating باید یکی از ${RATINGS.join('، ')} باشد.`)
      if (!LEVELS.includes(x.rainfall as Level) || !LEVELS.includes(x.humidity as Level)) errs.push(`${s.title}: rainfall و humidity باید ${LEVELS.join('/')} باشند.`)
      d.seasons[s.id] = { rating: x.rating as Rating, average_temperature: str(x.average_temperature), temperature_min: str(x.temperature_min), temperature_max: str(x.temperature_max), weather_condition: str(x.weather_condition), rainfall: x.rainfall as Level, humidity: x.humidity as Level, priority: str(x.priority ?? '0'), description: str(x.description) }
    }
    if (errs.length) { errors.push(...errs.map((e) => `${label}: ${e}`)); return }
    const r = fromDraft(d, firstId + items.length)
    if (!r.ok) { errors.push(...r.errors.map((e) => `${label}: ${e}`)); return }
    // fromDraft برای تصویر خالی عکس پیش‌فرض می‌گذارد؛ در پیش‌نویس «بدون تصویر» باید دیده شود
    items.push({ destination: { ...r.value, image: d.image }, image_query: typeof o.image_query === 'string' ? o.image_query.slice(0, 120) : `${r.value.name} ${r.value.country}` })
  })
  return { items, errors }
}

export interface ApprovalCheck { blocking: string[]; warnings: string[] }
/** شرایط انتشار در «پیشنهاد سفر» کاربران */
export function checkApproval(d: Destination, existing: Destination[]): ApprovalCheck {
  const blocking: string[] = [], warnings: string[] = []
  if (!d.image.trim()) blocking.push('تصویر انتخاب نشده است.')
  if (existing.some((e) => e.name.trim() === d.name.trim() && e.country === d.country)) blocking.push('مقصدی با همین نام و کشور از قبل وجود دارد.')
  if (d.latitude === undefined || d.longitude === undefined) warnings.push('بدون مختصات: آمار واقعی آب‌وهوای ۵ ساله برای این مقصد اعمال نمی‌شود.')
  if (d.attractions.length === 0) warnings.push('جاذبه‌ای ثبت نشده است.')
  return { blocking, warnings }
}

/** پرومپتی که می‌توان در هر هوش مصنوعی (یا بک‌اند آینده) استفاده کرد؛ خروجی باید دقیقاً با parseAiDestinations سازگار باشد. */
export function buildPrompt(names: string[]): string {
  const season = (id: string) => `"${id}": { "rating": "excellent|good|acceptable|not_recommended", "average_temperature": 20, "temperature_min": 10, "temperature_max": 30, "weather_condition": "معتدل و آفتابی", "rainfall": "low|medium|high", "humidity": "low|medium|high", "priority": 0, "description": "یک جملهٔ جذاب دربارهٔ این فصل" }`
  return `برای هر یک از مقصدهای زیر یک «پیشنهاد سفر» به فارسی بساز و فقط یک آرایهٔ JSON معتبر (بدون توضیح اضافه) برگردان.

مقصدها:
${names.map((n) => `- ${n}`).join('\n') || '- (نام مقصد)'}

قواعد:
- فقط اطلاعات واقعی و قابل‌اتکا بنویس؛ اگر مطمئن نیستی، فیلد را خالی بگذار نه حدسی.
- latitude و longitude دقیق شهر/مقصد را بده (برای آمار آب‌وهوای واقعی لازم است).
- تناسب هر فصل (rating) را با شرایط واقعی آب‌وهوا بسنج؛ دماها بر حسب سانتی‌گراد.
- image_url را خالی بگذار؛ فقط image_query (عبارت جست‌وجوی عکس) را بنویس.
- type فقط از: ${TRAVEL_TYPES.join('، ')}
- budget فقط از: ${BUDGETS.join('، ')}
- duration فقط از: ${DURATIONS.join('، ')}
- companions فقط از: ${COMPANIONS.join('، ')}
- scope: domestic یا international؛ visa_required برای مقصد داخلی null.

قالب هر مورد:
{
  "name": "", "country": "", "province_or_city": "", "scope": "domestic", "type": [], "description": "",
  "duration": "", "budget": "", "companions": [], "recommended_for": [], "attractions": [],
  "visa_required": null, "quality": 7, "latitude": 0, "longitude": 0, "image_url": "", "image_query": "",
  "seasons": {
    ${SEASONS.map((s) => season(s.id)).join(',\n    ')}
  }
}`
}
