# معماری پیشنهادی بک‌اند کاربران و تحلیل رفتار

وضعیت (مرحله ۲ از ۷): **اسکلت سرور Fastify در `server/` ساخته شده؛ فقط `/api/health` و `/api/ready` دارد.** هنوز جدول، احراز هویت، دریافت رویداد یا ادغام وجود ندارد. کلاینت (`src/analytics/*`) برای اتصال آماده است و پنل `/admin/users` فعلاً فقط داده‌ی ساختگی نشان می‌دهد.

## سرور (`server/`)
- Fastify 5 + zod (پیکربندی) + `postgres` (اتصال تنبل) + rate limit؛ تست با Vitest (`npm run test:server`).
- یک سرویس هم `dist/` و هم `/api/*` را سرو می‌کند (همدامنه). `assets/` کش بلند، `index.html` و `sw.js` همیشه revalidate؛ فایل ناموجود با پسوند 404 واقعی می‌دهد (نه HTML).
- متغیرها (فقط نام): `PORT` (Railway می‌دهد)، `DATABASE_URL` (اختیاری تا مرحله ۳)، `STATIC_DIR`، `RATE_LIMIT_PER_MIN`.
- **`npm start` هنوز `serve` است و استقرار فعلی تغییر نکرده.** برای سوئیچ (پس از تأیید): در `railway.json` مقدار `buildCommand` را `npm run build && npm run build:server` و `startCommand` را `npm run start:api` بگذارید؛ در صورت مشکل، برگرداندن همین دو خط کافی است. پیشنهاد healthcheck: `/api/health`.
- افزودن PostgreSQL (پس از تأیید شما): در همان پروژهٔ Railway: New → Database → PostgreSQL؛ سپس در سرویس برنامه متغیر `DATABASE_URL` را با Variable Reference به سرویس Postgres وصل کنید (مقدار را کپی نکنید).

## اجزا
- **API (Node/TS یا هر چارچوب)**: `POST /api/events` (دریافت دستهٔ رویدادها)، `POST /api/auth/*` (ثبت‌نام/ورود)، `POST /api/account/merge` (ادغام مهمان)، `GET/POST /api/admin/*` (قرارداد در `src/analytics/admin/api.ts`)، `DELETE /api/me/data` (حذف داده).
- **پایگاه داده (PostgreSQL پیشنهادی)**: جدول‌های `users, anonymous_installations, user_sessions, activity_events (partition ماهانه), user_preferences, user_interest_scores, consent_records, account_merge_logs, notification_preferences, admin_audit_logs` مطابق `src/analytics/types.ts`. زمان‌ها `timestamptz` (UTC).
- **احراز هویت کاربر**: ارائه‌دهندهٔ استاندارد (OTP پیامکی/ایمیلی یا OAuth) با نشست HttpOnly؛ رمز عبور فقط با argon2id/bcrypt هش شود. هیچ کلید خصوصی در کلاینت نباشد.
- **احراز هویت مدیر**: حساب جدا، RBAC سمت سرور (`ROLE_PERMISSIONS`)، MFA، audit log برای مشاهدهٔ تماس/خروجی/حذف.
- **ادغام**: داخل یک تراکنش؛ `mergeGuestIntoAccount` منطق مرجع و تست‌شده است. کلید یکتایی: `(user_id, anonymous_id)` + `event_id` یکتا.
- **اعلان تبلیغاتی**: صف جدا، فقط پس از تأیید مدیر، با بررسی رضایت `marketing`، لغو اشتراک و سقف تکرار (۷ روز).
- **نگهداری**: رویداد خام ۱۸ ماه (قابل تنظیم)، سپس تجمیع/حذف؛ IP فقط در لاگ امنیتی تا ۳۰ روز؛ حذف حساب = حذف/ناشناس‌سازی همهٔ جدول‌ها.
- **حریم خصوصی**: بدون اثرانگشت دستگاه/IMEI، بدون ذخیرهٔ دائمی GPS، بدون متن جست‌وجو؛ رضایت‌ها جدا (analytics / marketing / location).
