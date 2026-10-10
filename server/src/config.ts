import { z } from 'zod'

// فقط از متغیرهای محیطی خوانده می‌شود؛ هیچ مقدار حساسی در کد یا لاگ چاپ نمی‌شود.
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** اختیاری: بدون آن سرور بالا می‌آید ولی /api/ready مقدار «db: not_configured» می‌دهد */
  DATABASE_URL: z.string().min(1).optional(),
  STATIC_DIR: z.string().default('dist'),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().min(10).default(300),
})
export type Config = z.infer<typeof schema>
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => schema.parse(env)
