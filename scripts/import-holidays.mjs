// تبدیل خروجی persian-holidays (api/v1/all.json) به مناسبت‌های «سال‌محور» در public/data/calendar-data.json
//   node scripts/import-holidays.mjs <مسیر all.json> [--min 1399] [--max 1406]
// مناسبت‌های ثابت (occasions) دست‌نخورده می‌مانند؛ فقط کلید years جایگزین می‌شود و version یکی بالا می‌رود.
// ساختار هر ورودی: [عنوان, نوع, تعطیل؟]  —  نوع: 'r' مذهبی، 'n' ملی، 'i' جهانی؛ سومی فقط برای تعطیلات رسمی (۱).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const src = args.find((a) => !a.startsWith('--'))
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? Number(args[i + 1]) : def }
if (!src) { console.error('usage: node scripts/import-holidays.mjs <all.json> [--min 1399] [--max 1406]'); process.exit(1) }
const MIN = opt('min', 1399), MAX = opt('max', 1406)

const KIND = { religious: 'r', national: 'n', international: 'i' }
/** حذف تاریخ‌های داخل کروشه (قمری/میلادی)، یکدست‌کردن ی/ک عربی و فاصله‌ها */
export const cleanTitle = (t) => String(t).replace(/\s*\[[^\]]*\]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim()

const rows = JSON.parse(readFileSync(src, 'utf8'))
const years = {}
let kept = 0
for (const r of rows) {
  const [y, m, d] = String(r.date_shamsi).split('-').map(Number)
  const kind = KIND[r.type]
  const title = cleanTitle(r.title_fa)
  if (!y || !m || !d || y < MIN || y > MAX || !kind || !title) continue
  const key = `${m}-${d}`, list = ((years[y] ??= {})[key] ??= [])
  if (list.some((e) => e[0] === title)) continue // تکراری
  list.push(r.is_holiday ? [title, kind, 1] : [title, kind]); kept++
}
for (const y of Object.keys(years)) { // ترتیب کلیدها: ماه سپس روز (خروجی پایدار برای diff)
  years[y] = Object.fromEntries(Object.entries(years[y]).sort(([a], [b]) => { const [am, ad] = a.split('-').map(Number), [bm, bd] = b.split('-').map(Number); return am - bm || ad - bd }))
}

const file = fileURLToPath(new URL('../public/data/calendar-data.json', import.meta.url))
const data = JSON.parse(readFileSync(file, 'utf8'))
const next = { version: data.version + 1, occasions: data.occasions, years: Object.fromEntries(Object.entries(years).sort(([a], [b]) => a - b)) }
writeFileSync(file, JSON.stringify(next) + '\n')
console.log(`ok: ${kept} مناسبت برای سال‌های ${MIN}–${MAX}، نسخهٔ داده ${next.version}`)
