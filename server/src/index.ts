import { buildApp } from './app.js'
import { loadConfig } from './config.js'
import { createDb } from './db.js'

const config = loadConfig()
const db = config.DATABASE_URL ? createDb(config.DATABASE_URL) : null
const app = await buildApp({ config, db })
if (!db) app.log.warn('DATABASE_URL تنظیم نشده؛ فقط فایل‌های ثابت و /api/health فعال‌اند')

const stop = async () => { await app.close(); await db?.close(); process.exit(0) }
process.on('SIGTERM', stop); process.on('SIGINT', stop)
await app.listen({ port: config.PORT, host: '0.0.0.0' })
