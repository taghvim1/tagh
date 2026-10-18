export const CONSENT_TEXT: Record<'analytics' | 'marketing' | 'notifications', { title: string; text: string; defaultOn: boolean }> = {
  analytics: { title: 'تحلیل ناشناس استفاده', defaultOn: true, text: 'به‌طور پیش‌فرض روشن است. فقط رویدادهای کلی (مثل مشاهدهٔ مقصد یا فصل) با یک شناسهٔ تصادفی؛ بدون نام، موقعیت و متن جست‌وجو.' },
  marketing: { title: 'پیشنهادها و تبلیغات شخصی‌سازی‌شده', defaultOn: true, text: 'به‌طور پیش‌فرض روشن است. پیشنهادها بر اساس علایق برآوردشده از استفادهٔ شما نمایش داده می‌شود.' },
  notifications: { title: 'اعلان‌ها', defaultOn: true, text: 'به‌طور پیش‌فرض روشن است. اجازهٔ اعلان مرورگر جداگانه و فقط با اقدام شما پرسیده می‌شود.' },
}
