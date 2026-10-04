import type { JalaliDate } from './jalali'

// روز انتخاب‌شده در تقویم؛ فقط در حافظه (برای استفادهٔ صفحهٔ پیشنهاد سفر هنگام جابه‌جایی بین صفحه‌ها)
let selectedDate: JalaliDate | null = null

export const getSelectedDate = () => selectedDate
export const setSelectedDate = (date: JalaliDate) => { selectedDate = date }
