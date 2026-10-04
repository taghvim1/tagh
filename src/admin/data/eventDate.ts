import { MONTHS, faNum, monthLength } from '../../lib/jalali'

const FA = '۰۱۲۳۴۵۶۷۸۹'
const AR = '٠١٢٣٤٥٦٧٨٩'

export const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (c) => String(FA.indexOf(c))).replace(/[٠-٩]/g, (c) => String(AR.indexOf(c)))

export const toPersianDigits = (s: string) => s.replace(/\d/g, (d) => FA[Number(d)])

export type ParsedDate = { ok: true; date: string; calendar_date: string } | { ok: false; error: string }

/** ورودی مثل ۱۴۰۵/۰۱/۱۳ (با ارقام فارسی، عربی یا لاتین) را اعتبارسنجی و نرمال می‌کند. */
export function parseJalaliInput(input: string): ParsedDate {
  const m = toLatinDigits(input.trim()).match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (!m) return { ok: false, error: 'تاریخ را به شکل ۱۴۰۵/۰۱/۱۳ وارد کنید.' }
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (year < 1300 || year > 1500) return { ok: false, error: 'سال باید بین ۱۳۰۰ و ۱۵۰۰ باشد.' }
  if (month < 1 || month > 12) return { ok: false, error: 'ماه باید بین ۱ و ۱۲ باشد.' }
  if (day < 1 || day > monthLength({ year, month })) return { ok: false, error: 'این روز در آن ماه وجود ندارد.' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    ok: true,
    date: `${faNum(day)} ${MONTHS[month - 1]}`,
    calendar_date: toPersianDigits(`${year}/${pad(month)}/${pad(day)}`),
  }
}
