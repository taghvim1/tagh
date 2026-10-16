// موضوع‌های «محتوای صفحهٔ اصلی». شناسه و عنوان باید با server/src/feed/schema.ts یکی باشد (تست server/tests/feed.test.ts).
export const FEED_KINDS = ['dyk', 'mood', 'monthly', 'personal', 'week', 'calendar', 'mini', 'wishlist', 'discovery'] as const
export type FeedKind = (typeof FEED_KINDS)[number]

/** موضوع‌های کاشی صفحهٔ دوم (کنار تقویم هفتگی)، به ترتیب نمایش */
export const TILE_KINDS = FEED_KINDS.filter((k): k is Exclude<FeedKind, 'dyk'> => k !== 'dyk')

export const FEED_TITLE: Record<FeedKind, string> = {
  dyk: 'آیا می‌دانستید',
  mood: 'حال‌وهوای امروز',
  monthly: 'این ماه وقت کجاست؟',
  personal: 'پیشنهاد مخصوص تو',
  week: 'این هفته کجا بریم؟',
  calendar: 'تقویمی که برای سفر زندگی می‌کند',
  mini: 'سفرهای کوچک، خاطره‌های بزرگ',
  wishlist: 'لیست آرزوهای سفر من',
  discovery: 'هر روز یک کشف تازه',
}

/** دکمهٔ اقدام داخل پاپ‌آپ (فقط برای موضوع‌هایی که در طرح دکمه دارند) */
export const FEED_CTA: Partial<Record<FeedKind, { label: string; href: string }>> = {
  mood: { label: 'کشف سفر', href: '/travel-suggestions' },
  week: { label: 'برنامه سفرم رو بچین', href: '/travel-suggestions' },
}

export const isFeedKind = (k: string): k is FeedKind => (FEED_KINDS as readonly string[]).includes(k)
