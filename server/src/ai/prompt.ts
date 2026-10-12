import { BUDGETS, COMPANIONS, DURATIONS, LEVELS, RATINGS, TRAVEL_TYPES } from '../domain/schema.js'

export const REQUIRED_PLACEHOLDERS = ['{{names}}', '{{schema}}'] as const
export const DEFAULT_TEMPLATE = `برای مقصد زیر یک «پیشنهاد سفر» به فارسی بساز و فقط یک شیء JSON معتبر (بدون توضیح اضافه) برگردان.

مقصد: {{names}}

قواعد:
- فقط اطلاعات واقعی و قابل‌اتکا بنویس؛ اگر مطمئن نیستی، فیلد را خالی بگذار یا حذف کن، نه حدسی. هیچ واقعیتی نساز.
- اگر «منابع وب» در پایین آمده، اطلاعات را با آن‌ها تطبیق بده و از آن‌ها فراتر نرو.
- latitude و longitude دقیق شهر/مقصد (برای آمار آب‌وهوا لازم است)؛ اگر مطمئن نیستی هر دو را حذف کن.
- تناسب هر فصل (rating) را با شرایط واقعی آب‌وهوا بسنج؛ دماها بر حسب سانتی‌گراد و min ≤ average ≤ max.
- نام عکس نساز؛ فقط image_query (عبارت جست‌وجوی عکس، ترجیحاً انگلیسی) بنویس.
- مقدارهای مجاز:
{{enums}}

قالب خروجی:
{{schema}}

منابع وب (در صورت وجود):
{{sources}}`

const season = `{ "rating": "${RATINGS.join('|')}", "average_temperature": 20, "temperature_min": 10, "temperature_max": 30, "weather_condition": "معتدل و آفتابی", "rainfall": "${LEVELS.join('|')}", "humidity": "${LEVELS.join('|')}", "priority": 0, "description": "یک جملهٔ جذاب دربارهٔ این فصل" }`
export const SCHEMA_TEXT = `{
  "name": "", "country": "", "province_or_city": "", "scope": "domestic|international", "type": [], "description": "",
  "duration": "", "budget": "", "companions": [], "recommended_for": [], "attractions": [],
  "visa_required": null, "quality": 7, "latitude": 0, "longitude": 0, "image_query": "",
  "seasons": { "spring": ${season}, "summer": ..., "autumn": ..., "winter": ... }
}`
export const ENUMS_TEXT = [
  `- type فقط از: ${TRAVEL_TYPES.join('، ')}`, `- budget فقط از: ${BUDGETS.join('، ')}`, `- duration فقط از: ${DURATIONS.join('، ')}`,
  `- companions فقط از: ${COMPANIONS.join('، ')}`, '- visa_required برای مقصد داخلی null است.',
].join('\n')

export const validateTemplate = (t: string): string[] => REQUIRED_PLACEHOLDERS.filter((p) => !t.includes(p)).map((p) => `متن باید شامل ${p} باشد.`)

export function renderPrompt(template: string, name: string, sources: { title: string; url: string; snippet?: string }[]): string {
  const src = sources.length ? sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})${s.snippet ? `\n    ${s.snippet}` : ''}`).join('\n') : '(منبع وبی در دسترس نیست؛ فقط به دانستهٔ مطمئن تکیه کن)'
  return template.replaceAll('{{names}}', name).replaceAll('{{schema}}', SCHEMA_TEXT).replaceAll('{{enums}}', ENUMS_TEXT).replaceAll('{{sources}}', src)
}
