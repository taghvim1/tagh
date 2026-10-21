import type { BookingSite, PackageInput } from './schema.js'

// سایت‌های شناخته‌شدهٔ رزرو (فهرست ثابت)؛ آدرس‌ها صفحهٔ اصلی‌اند تا قابل‌اتکا بمانند.
const FLIGHT: BookingSite[] = [
  { name: 'علی‌بابا', url: 'https://www.alibaba.ir', note: 'بلیط پرواز، قطار و اتوبوس' },
  { name: 'فلای‌تودی', url: 'https://www.flytoday.ir', note: 'بلیط هواپیما' },
  { name: 'مستربلیط', url: 'https://www.mrbilit.ir', note: 'مقایسهٔ بلیط' },
]
const BY_VEHICLE: Record<PackageInput['vehicle'], BookingSite[]> = {
  هواپیما: FLIGHT,
  قطار: [{ name: 'راجا', url: 'https://www.raja.ir', note: 'بلیط قطار (رجا)' }, FLIGHT[0], FLIGHT[2]],
  اتوبوس: [FLIGHT[0], FLIGHT[2]],
  'خودروی شخصی': [],
  'کشتی یا لنج': [FLIGHT[0]],
}
const STAY: BookingSite[] = [
  { name: 'جاباما', url: 'https://www.jabama.com', note: 'اقامتگاه، ویلا و سوئیت' },
  { name: 'اسنپ‌تریپ', url: 'https://www.snapptrip.com', note: 'هتل و اقامتگاه' },
  { name: 'اتاقک', url: 'https://www.otaghak.com', note: 'اقامتگاه بومگردی' },
  { name: 'اقامت۲۴', url: 'https://www.eghamat24.com', note: 'رزرو هتل' },
]
export const bookingFor = (i: PackageInput): BookingSite[] => [...BY_VEHICLE[i.vehicle], ...STAY].slice(0, 6)
