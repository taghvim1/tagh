// شمارهٔ موبایل ایران (هم‌منطق با سرور): ارقام فارسی/عربی، فاصله/خط‌تیره و پیش‌شمارهٔ +98 / 0098 / 98 ⇒ «09xxxxxxxxx»
const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩'
export const toLatinDigits = (s: string) => s.replace(/[۰-۹٠-٩]/g, (d) => String(FA.includes(d) ? FA.indexOf(d) : AR.indexOf(d)))
export function normalizeIranMobile(input: string): string | null {
  if (input.length > 40) return null
  let s = toLatinDigits(input).replace(/[\s\-().\u200c\u200f\u200e]/g, '')
  if (s.startsWith('+98')) s = '0' + s.slice(3)
  else if (s.startsWith('0098')) s = '0' + s.slice(4)
  else if (/^98\d{10}$/.test(s)) s = '0' + s.slice(2)
  else if (/^9\d{9}$/.test(s)) s = '0' + s
  return /^09\d{9}$/.test(s) ? s : null
}
