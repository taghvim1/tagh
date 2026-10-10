# معماری پیشنهادی بک‌اند کاربران و تحلیل رفتار

وضعیت: **بک‌اند وجود ندارد.** کلاینت (`src/analytics/*`) برای اتصال به آن آماده است؛ پنل `/admin/users` فعلاً فقط داده‌ی ساختگی نشان می‌دهد.

## اجزا
- **API (Node/TS یا هر چارچوب)**: `POST /api/events` (دریافت دستهٔ رویدادها)، `POST /api/auth/*` (ثبت‌نام/ورود)، `POST /api/account/merge` (ادغام مهمان)، `GET/POST /api/admin/*` (قرارداد در `src/analytics/admin/api.ts`)، `DELETE /api/me/data` (حذف داده).
- **پایگاه داده (PostgreSQL پیشنهادی)**: جدول‌های `users, anonymous_installations, user_sessions, activity_events (partition ماهانه), user_preferences, user_interest_scores, consent_records, account_merge_logs, notification_preferences, admin_audit_logs` مطابق `src/analytics/types.ts`. زمان‌ها `timestamptz` (UTC).
- **احراز هویت کاربر**: ارائه‌دهندهٔ استاندارد (OTP پیامکی/ایمیلی یا OAuth) با نشست HttpOnly؛ رمز عبور فقط با argon2id/bcrypt هش شود. هیچ کلید خصوصی در کلاینت نباشد.
- **احراز هویت مدیر**: حساب جدا، RBAC سمت سرور (`ROLE_PERMISSIONS`)، MFA، audit log برای مشاهدهٔ تماس/خروجی/حذف.
- **ادغام**: داخل یک تراکنش؛ `mergeGuestIntoAccount` منطق مرجع و تست‌شده است. کلید یکتایی: `(user_id, anonymous_id)` + `event_id` یکتا.
- **اعلان تبلیغاتی**: صف جدا، فقط پس از تأیید مدیر، با بررسی رضایت `marketing`، لغو اشتراک و سقف تکرار (۷ روز).
- **نگهداری**: رویداد خام ۱۸ ماه (قابل تنظیم)، سپس تجمیع/حذف؛ IP فقط در لاگ امنیتی تا ۳۰ روز؛ حذف حساب = حذف/ناشناس‌سازی همهٔ جدول‌ها.
- **حریم خصوصی**: بدون اثرانگشت دستگاه/IMEI، بدون ذخیرهٔ دائمی GPS، بدون متن جست‌وجو؛ رضایت‌ها جدا (analytics / marketing / location).
