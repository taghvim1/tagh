# بک‌اند پیشنهادهای سفر و تنظیمات API (محیط آزمایشی)

## اجرا
- محلی: `npm run build && npm run build:server && PORT=3100 node server/dist/index.js` (فرانت ساخته‌شده و `/api/*` از یک سرویس).
- توسعه: `npm run dev` (Vite، پروکسی `/api` به پورت ۳۰۰۰) و `PORT=3000 node server/dist/index.js`.
- تست: `npm test` (کلاینت)، `npm run test:server` (سرور، با fetch ساختگی؛ هیچ تماس واقعی با Gemini/جست‌وجو انجام نمی‌شود).
- `railway.json`: build = `npm run build && npm run build:server`، start = `npm run start:api`. بازگشت: `buildCommand: npm run build`، `startCommand: npm start`.

## ذخیره‌سازی (آزمایشی)
فایل JSON در `DATA_DIR` (پیش‌فرض `data/`). روی Railway بدون Volume با هر استقرار پاک می‌شود. رابط `Store` (server/src/store/types.ts) async است و طرح PostgreSQL متناظر در `server/migrations/001_init.sql` آماده است؛ برای انتقال فقط باید یک پیاده‌سازی `Store` برای PostgreSQL نوشت (هنوز نوشته/آزمایش نشده).

## متغیرهای محیطی
| متغیر | کاربرد |
|---|---|
| `GEMINI_API_KEY` | کلید Gemini (اولویت بر کلید واردشده از رابط) |
| `BRAVE_SEARCH_API_KEY` | جست‌وجوی وب برای منبع‌یابی |
| `PEXELS_API_KEY` | جست‌وجوی تصویر Pexels (Wikimedia بدون کلید) |
| `SECRETS_ENCRYPTION_KEY` | (≥۱۶ نویسه) فعال‌کنندهٔ ذخیرهٔ رمزنگاری‌شدهٔ کلید از صفحهٔ «تنظیمات API» |
| `ADMIN_TOKEN` | (≥۱۶ نویسه) اگر تنظیم شود همهٔ `/api/admin/*` به `Authorization: Bearer` نیاز دارد |
| `ADMIN_OPEN=true` | فقط تست: در production بدون ADMIN_TOKEN دسترسی بازِ ادمین را روشن می‌کند |
| `DATA_DIR` | مسیر ذخیرهٔ آزمایشی (Volume برای ماندگاری) |
| `DATABASE_URL` | فعلاً فقط برای `/api/ready`؛ هنوز دادهٔ پیشنهادها در PostgreSQL نیست |

## امنیت (وضعیت فعلی)
- هنوز **ورود ادمین واقعی نیست**. در development دسترسی بازِ آزمایشی است؛ در production بدون `ADMIN_TOKEN` یا `ADMIN_OPEN=true` همهٔ `/api/admin/*` با ۵۰۳ بسته است.
- ذخیرهٔ کلید از رابط در production بدون `ADMIN_TOKEN` مسدود است. کلیدها هرگز در پاسخ API (فقط ۴ نویسهٔ آخر)، لاگ یا فایل‌های build نمی‌آیند.
- پیش از انتشار عمومی: احراز هویت واقعی + نقش‌ها + ثبت اقدامات مدیر.

## چرخهٔ پیشنهاد
draft → pending_review → approved → published (و rejected با دلیل، archived). انتشار فقط با تصویر اصلیِ «تأییدشده» دارای مجوز و بدون پیشنهاد منتشرشدهٔ هم‌نام. ویرایش متنِ منتشرشده، انتشار را لغو می‌کند. هر ویرایش یک نسخهٔ جدید می‌سازد (مقایسه و بازگردانی در پنل).
