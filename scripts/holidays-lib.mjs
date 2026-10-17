// منطق خالص تبدیل داده‌ی persian-holidays به مناسبت‌های اپ (بدون خواندن/نوشتن فایل؛ قابل تست).
// دسته‌ها (kind): r مذهبی، a باستانی و آیینی، i جهانی، n ملی. تعطیلی رسمی جدا با پرچم سوم ثبت می‌شود و هرگز پنهان نمی‌شود.

/** حذف تاریخ‌های داخل کروشه (قمری/میلادی)، یکدست‌کردن ی/ک عربی و فاصله‌ها */
export const cleanTitle = (t) => String(t).replace(/\s*\[[^\]]*\]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim()

// جشن‌ها و آیین‌های غیرایرانی که منبع «ملی» ثبت کرده ولی جهانی‌اند
const INTERNATIONAL = ['کریسمس', 'ولنتاین', 'سال نو میلادی']

// جشن‌ها و آیین‌های ایران باستان و آیین‌های ایرانی (نوروز، چهارشنبه‌سوری، یلدا، گان‌ها، دیگان، سده، زرتشت، کوروش …)
const ANCIENT = [
  'نوروز', 'یلدا', 'چله', 'سده', 'نوسره', 'چهارشنبه سوری', 'چهارشنبه‌سوری', 'سیزده به در', 'گاهنبار', 'پاییزان',
  'فروردینگان', 'اردیبهشتگان', 'خردادگان', 'تیرگان', 'امردادگان', 'اَمردادگان', 'شهریورگان', 'مهرگان', 'آبانگان', 'آبانگاه', 'آذرگان', 'آذر جشن', 'دیگان', 'بهمنگان', 'سپندارمذگان', 'اسفندگان', 'سروشگان',
  'بهاربد', 'آب پاشونک', 'خام خواری', 'گیاه آوری', 'میلاد خورشید', 'خرم روز', 'جشن میانه', 'جشن آغاز', 'روز،جشن', 'روز ،جشن', 'روز، جشن',
  'زرتشت', 'کوروش',
]

// مناسبت‌های مذهبیِ ثبت‌شده با نوع «ملی» در منبع (اربعین، مبعث …). نوع religious منبع بدون این فهرست هم مذهبی است.
const RELIGIOUS = [
  'علیه السلام', 'علیها السلام', 'سلام الله', '(ص)', 'عید سعید', 'اربعین', 'مبعث', 'عاشورا', 'تاسوعا', 'غدیر',
  'ولادت امام', 'ولادت حضرت', 'شهادت امام', 'شهادت حضرت', 'رحلت رسول', 'میلاد رسول', 'پیامبر اکرم', 'نیمه شعبان', 'شب قدر', 'ضربت خوردن',
]

export const KINDS = ['r', 'a', 'i', 'n']

/** دستهٔ یک مناسبت: ترتیب بررسی مهم است (جهانی، سپس باستانی، سپس مذهبی، در غیر این صورت ملی) */
export function classify(title, sourceType) {
  if (sourceType === 'international' || INTERNATIONAL.some((k) => title.includes(k))) return 'i'
  if (ANCIENT.some((k) => title.includes(k))) return 'a'
  if (sourceType === 'religious' || RELIGIOUS.some((k) => title.includes(k))) return 'r'
  return 'n'
}

const keyOf = (s) => s.split('-').map(Number)

/** ردیف‌های خام منبع ⇒ { [سال]: { 'ماه-روز': [[عنوان, دسته, ۱?]] } } */
export function buildYears(rows, min = 1399, max = 1406) {
  const years = {}
  let kept = 0
  const perKind = { r: 0, a: 0, i: 0, n: 0 }
  for (const r of rows) {
    const [y, m, d] = String(r.date_shamsi).split('-').map(Number)
    const title = cleanTitle(r.title_fa)
    if (!y || !m || !d || y < min || y > max || !title) continue
    const kind = classify(title, r.type)
    const key = `${m}-${d}`, list = ((years[y] ??= {})[key] ??= [])
    if (list.some((e) => e[0] === title)) continue // تکراری
    list.push(r.is_holiday ? [title, kind, 1] : [title, kind]); kept++; perKind[kind]++
  }
  const sorted = {}
  for (const y of Object.keys(years).sort((a, b) => a - b)) {
    sorted[y] = Object.fromEntries(Object.entries(years[y]).sort(([a], [b]) => { const [am, ad] = keyOf(a), [bm, bd] = keyOf(b); return am - bm || ad - bd }))
  }
  return { years: sorted, kept, perKind }
}
