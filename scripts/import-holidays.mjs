// تبدیل خروجی persian-holidays (api/v1/all.json) به مناسبت‌های «سال‌محور» در public/data/calendar-data.json
//   node scripts/import-holidays.mjs <مسیر all.json> [--min 1399] [--max 1406]
// کل داده‌ی مناسبت‌ها از نو ساخته می‌شود (مناسبت‌های دستی/آزمایشی قبلی پاک می‌شوند) و version یکی بالا می‌رود.
// ساختار هر ورودی: [عنوان, دسته, تعطیل؟] — دسته: r مذهبی، a باستانی و آیینی، i جهانی، n ملی؛ سومی فقط برای تعطیلات رسمی (۱).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildYears } from './holidays-lib.mjs'

const args = process.argv.slice(2)
const src = args.find((a) => !a.startsWith('--'))
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? Number(args[i + 1]) : def }
if (!src) { console.error('usage: node scripts/import-holidays.mjs <all.json> [--min 1399] [--max 1406]'); process.exit(1) }
const MIN = opt('min', 1399), MAX = opt('max', 1406)

const { years, kept, perKind } = buildYears(JSON.parse(readFileSync(src, 'utf8')), MIN, MAX)
const file = fileURLToPath(new URL('../public/data/calendar-data.json', import.meta.url))
let version = 1
try { version = JSON.parse(readFileSync(file, 'utf8')).version + 1 } catch { /* فایل نبود: از نسخهٔ ۱ */ }
const next = {
  version,
  source: 'persian-holidays (time.ir via hasan-ahani/shamsi-holidays)',
  occasions: {}, // مناسبت‌های ثابتِ دستی (کلید «ماه-روز»)؛ پس از ریست خالی است
  years,
}
writeFileSync(file, JSON.stringify(next) + '\n')
console.log(`ok: ${kept} مناسبت برای سال‌های ${MIN}–${MAX} (مذهبی ${perKind.r}، باستانی/آیینی ${perKind.a}، جهانی ${perKind.i}، ملی ${perKind.n})، نسخهٔ داده ${version}`)
