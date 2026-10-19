import { z } from 'zod'

// فقط از متغیرهای محیطی خوانده می‌شود؛ هیچ مقدار حساسی در کد یا لاگ چاپ نمی‌شود.
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** اختیاری: بدون آن سرور بالا می‌آید ولی /api/ready مقدار «db: not_configured» می‌دهد */
  DATABASE_URL: z.string().min(1).optional(),
  STATIC_DIR: z.string().default('dist'),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().min(10).default(300),
  /** پوشهٔ ذخیره‌سازی آزمایشی (فایل JSON). روی Railway بدون Volume با هر استقرار پاک می‌شود. */
  DATA_DIR: z.string().default('data'),
  /** اگر تنظیم شود، همهٔ /api/admin/* به هدر Authorization: Bearer <token> نیاز دارد */
  ADMIN_TOKEN: z.string().min(16).optional(),
  /** فقط برای تست: در production بدون ADMIN_TOKEN، دسترسی بازِ ادمین را آگاهانه روشن می‌کند */
  ADMIN_OPEN: z.enum(['true', 'false']).default('false'),
  /** کلید رمزنگاری برای ذخیرهٔ کلیدهای API واردشده از رابط مدیریت (حداقل ۱۶ نویسه) */
  SECRETS_ENCRYPTION_KEY: z.string().min(16).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),
  /** کلید وب‌سرویس قاصدک برای ورود پیامکی (یا از «تنظیمات API» پنل مدیریت) */
  GHASEDAK_API_KEY: z.string().min(1).optional(),
  /** نشانی پایهٔ وب‌سرویس قاصدک. پیش‌فرض https است؛ فقط اگر https پشتیبانی نشد (مثل مستند http) عمداً تغییر دهید. */
  GHASEDAK_BASE_URL: z.string().url().default('https://api.ghasedaksms.com'),
  /** فقط برای توسعهٔ محلی (NODE_ENV=development و بدون کلید پیامک): کد ورود در پاسخ برگردانده می‌شود. در production هرگز اثر ندارد. */
  AUTH_DEV_ECHO: z.enum(['true', 'false']).default('false'),
})
export type Config = z.infer<typeof schema>
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => schema.parse(env)
