// شمارهٔ موبایل ایران: ارقام فارسی/عربی، فاصله و خط‌تیره، پیش‌شمارهٔ +98 / 0098 / 98 پذیرفته می‌شود؛ خروجی هم‌شکل «09xxxxxxxxx».
const DIGITS: Record<string, string> = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }
export const toLatinDigits = (s: string) => s.replace(/[۰-۹٠-٩]/g, (d) => DIGITS[d])
export function normalizeIranMobile(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 40) return null
  let s = toLatinDigits(input).replace(/[\s\-().\u200c\u200f\u200e]/g, '')
  if (s.startsWith('+98')) s = '0' + s.slice(3)
  else if (s.startsWith('0098')) s = '0' + s.slice(4)
  else if (/^98\d{10}$/.test(s)) s = '0' + s.slice(2)
  else if (/^9\d{9}$/.test(s)) s = '0' + s
  return /^09\d{9}$/.test(s) ? s : null
}
export const maskPhone = (p: string) => `${p.slice(0, 4)}***${p.slice(-4)}`
