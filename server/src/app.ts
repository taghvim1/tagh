import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import type { Config } from './config.js'
import type { Db } from './db.js'
import { createAiService } from './ai/service.js'
import { createFeedService } from './feed/service.js'
import { createGhasedak } from './auth/ghasedak.js'
import { createAuthService } from './auth/service.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { eventRoutes } from './routes/events.js'
import { feedPublicRoutes } from './routes/feed.js'
import { publicRoutes } from './routes/public.js'
import { createSecrets } from './secrets.js'
import { createJsonStore } from './store/jsonStore.js'
import type { Store } from './store/types.js'

export interface AppDeps { config: Config; db?: Db | null; store?: Store; fetchImpl?: typeof fetch; /** فقط برای تست: ساعت قابل تزریق */ now?: () => number }

export async function buildApp({ config, db = null, store: injected, fetchImpl, now }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.NODE_ENV === 'test' ? false : { level: 'info', redact: ['req.headers.authorization', 'req.headers.cookie'] }, trustProxy: true, bodyLimit: 64 * 1024 })

  await app.register(rateLimit, { global: false })
  const store = injected ?? await createJsonStore(config.NODE_ENV === 'test' ? undefined : resolve(config.DATA_DIR, 'store.json'))
  app.addHook('onClose', async () => { await store.close() })
  const secrets = createSecrets(config, store)
  const ai = createAiService({ store, secrets, fetch: fetchImpl ?? ((...a) => fetch(...a)) })
  const feed = createFeedService({ store, ai })
  const sms = createGhasedak({ secrets, baseUrl: config.GHASEDAK_BASE_URL, fetchImpl })
  const auth = createAuthService({ store, secrets, sms, config, now })

  app.addHook('onSend', async (req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff').header('Referrer-Policy', 'strict-origin-when-cross-origin')
    // پاسخ‌های API (اطلاعات شخصی/مدیریتی) هرگز کش نشوند
    if (req.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store')
  })

  await app.register(async (api) => {
    await api.register(rateLimit, { max: config.RATE_LIMIT_PER_MIN, timeWindow: '1 minute' })
    // زنده‌بودن پردازش؛ به دیتابیس وابسته نیست (برای healthcheck پلتفرم)
    api.get('/health', async () => ({ status: 'ok' }))
    publicRoutes(api, store)
    feedPublicRoutes(api, feed)
    eventRoutes(api, store)
    authRoutes(api, { config, auth })
    adminRoutes(api, { config, store, secrets, ai, feed, auth, sms })
    // آمادگی: وضعیت دیتابیس بدون افشای جزئیات اتصال
    api.get('/ready', async (_req, reply) => {
      if (!db) return reply.code(503).send({ status: 'degraded', db: 'not_configured' })
      try { await db.ping(); return { status: 'ok', db: 'up' } } catch { return reply.code(503).send({ status: 'degraded', db: 'unreachable' }) }
    })
  }, { prefix: '/api' })

  // فرانت‌اند ساخته‌شده: assets با hash کش بلندمدت؛ index.html و sw.js همیشه revalidate
  const root = resolve(config.STATIC_DIR)
  if (existsSync(resolve(root, 'index.html'))) {
    await app.register(fastifyStatic, {
      root, wildcard: false,
      setHeaders: (res, path) => {
        if (/[\\/]assets[\\/]/.test(path)) res.header('Cache-Control', 'public, max-age=31536000, immutable')
        else if (/(sw\.js|index\.html|manifest\.webmanifest)$/.test(path)) res.header('Cache-Control', 'no-cache')
      },
    })
  }
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || req.url === '/api') return reply.code(404).send({ error: 'not_found' })
    // مسیرهای کلاینت (SPA) → index.html؛ فایل‌های ناموجود (دارای پسوند) 404 واقعی می‌گیرند تا chunk قدیمی HTML برنگرداند
    const last = req.url.split('?')[0].split('/').pop() ?? ''
    if (req.method === 'GET' && !last.includes('.') && existsSync(resolve(root, 'index.html'))) return reply.header('Cache-Control', 'no-cache').type('text/html').sendFile('index.html')
    return reply.code(404).send({ error: 'not_found' })
  })
  return app
}
