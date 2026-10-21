import type { PackageInput } from './schema.js'

export const PACKAGE_REQUIRED = ['{{origin}}', '{{destination}}', '{{days}}', '{{schema}}'] as const

export const DEFAULT_PACKAGE_PROMPT = `تو یک مشاورِ باتجربهٔ سفر برای مسافران ایرانی هستی. بر اساس مشخصات زیر یک «پکیج سفر» کوتاه، دقیق و قابل اجرا به فارسی طراحی کن و فقط یک شیء JSON معتبر (بدون هیچ متن اضافه) برگردان.

مشخصات سفر:
- شهر مبدأ: {{origin}}
- شهر مقصد: {{destination}}
- بودجه: {{budget}}{{amount}}
- وسیلهٔ نقلیه: {{vehicle}}
- نوع سفر: {{trip_type}}
- تعداد روز: {{days}}

اصول طراحی:
- برنامه دقیقاً {{days}} روز باشد؛ روز اول شامل رسیدن و روز آخر شامل بازگشت. مدت رفت‌وآمد با همان وسیلهٔ نقلیه را در برنامهٔ روزها لحاظ کن.
- هر روز حداکثر ۳ تا ۴ مورد باشد؛ هر مورد یک عبارت کوتاه (نام مکان یا فعالیت، حداکثر ۸ کلمه) بدون توضیح اضافه و بدون جملهٔ تبلیغاتی. ترتیب مکان‌ها جغرافیایی و منطقی باشد.
- با «نوع سفر» هماهنگ باش و با «بودجه»: اقتصادی ⇒ اقامت ساده و غذای محلی؛ متوسط ⇒ هتل سه تا چهار ستاره؛ لوکس ⇒ هتل‌های برتر و تجربه‌های ویژه. اگر مبلغ مشخص شده، برنامه را در همان حدود طراحی کن.
- قیمت‌ها (بسیار مهم): فقط از «منابع وب» بردار. هرگز قیمتی بالاتر از آنچه منابع نشان می‌دهند ننویس. اگر قیمتی در منابع نیست، یک بازهٔ محتاطانه و کم‌خطا بگذار و آن ردیف را estimated=true کن. همهٔ مبالغ به «تومان» و عدد صحیح (مثلاً 1500000)، برای هر نفر. جمع کل را نزن؛ سیستم خودش جمع می‌زند.
- ردیف‌های هزینه: حمل‌ونقل (رفت‌وبرگشت)، اقامت (کل شب‌ها)، غذا، ورودی‌ها و متفرقه. هر ردیف min و max دارد (min ≤ max).
- tips «نکات مهم مقصد» است: آداب و پوشش، ایمنی، آب‌وهوا، کلاهبرداری‌های رایج، ساعت کاری و رزرو قبلی، غذا و سوغات مهم. کوتاه و عملی (هر کدام یک جمله).
- فقط اطلاعات واقعی بنویس؛ هیچ مکان، قیمت یا ساعتی نساز. اگر مبدأ و مقصد یکی‌اند یا مسیر با وسیلهٔ انتخابی ممکن نیست، در warnings صریح بگو.
- image_query: عبارت انگلیسی کوتاه شامل نام شهر و یک نماد شناخته‌شدهٔ آن.

قالب خروجی:
{{schema}}

منابع وب (در صورت وجود):
{{sources}}`

export const PACKAGE_SCHEMA_TEXT = `{
  "title": "عنوان کوتاه", "summary": "حداکثر دو جمله", "best_season": "بهترین زمان سفر",
  "transport": "یک تا دو جمله دربارهٔ مسیر و مدت رفت‌وآمد",
  "days": [ { "day": 1, "title": "عنوان کوتاه روز", "plan": ["مورد کوتاه ۱", "مورد کوتاه ۲"] } ],
  "cost": { "items": [ { "label": "حمل‌ونقل", "min": 1500000, "max": 2000000, "estimated": false } ], "note": "توضیح کوتاه دربارهٔ مبنای قیمت‌ها" },
  "tips": ["نکتهٔ کوتاه ۱"], "warnings": [], "image_query": "Shiraz Nasir al-Mulk Mosque"
}`

export const validatePackagePrompt = (t: string): string[] => PACKAGE_REQUIRED.filter((p) => !t.includes(p)).map((p) => `متن باید شامل ${p} باشد.`)

export function renderPackagePrompt(template: string, i: PackageInput, sources: { title: string; url: string; snippet?: string }[]): string {
  const src = sources.length ? sources.map((s, n) => `[${n + 1}] ${s.title} (${s.url})${s.snippet ? `\n    ${s.snippet}` : ''}`).join('\n') : '(منبع وبی در دسترس نیست؛ همهٔ قیمت‌ها را estimated=true و محتاطانه بنویس)'
  const amount = i.amount_toman ? ` (حدود ${i.amount_toman.toLocaleString('en-US')} تومان برای هر نفر)` : ''
  return template.replaceAll('{{origin}}', i.origin).replaceAll('{{destination}}', i.destination).replaceAll('{{budget}}', i.budget).replaceAll('{{amount}}', amount)
    .replaceAll('{{vehicle}}', i.vehicle).replaceAll('{{trip_type}}', i.trip_type).replaceAll('{{days}}', String(i.days)).replaceAll('{{schema}}', PACKAGE_SCHEMA_TEXT).replaceAll('{{sources}}', src)
    + '\n\nقواعد ثابت: مقادیر ورودی را عوض نکن؛ متن‌ها فارسی و مختصر باشند جز image_query؛ فقط JSON خالص برگردان.'
}
