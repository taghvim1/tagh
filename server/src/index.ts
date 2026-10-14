import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { buildApp } from './app.js'
import { loadConfig } from './config.js'
import { createDb } from './db.js'
import { createPgStore } from './store/pgStore.js'

const config = loadConfig()
const db = config.DATABASE_URL ? createDb(config.DATABASE_URL) : null
// با DATABASE_URL همهٔ دادهٔ مدیریت (پیشنهادها، تنظیمات، کلیدهای رمزنگاری‌شده، رویدادها) در PostgreSQL ماندگار می‌شود؛ بدون آن فایل JSON آزمایشی.
let store
let sql: ReturnType<typeof postgres> | null = null
if (config.DATABASE_URL) {
  sql = postgres(config.DATABASE_URL, { max: 5, idle_timeout: 20, connect_timeout: 10, onnotice: () => undefined })
  const migration = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../migrations/001_init.sql'), 'utf8')
  store = await createPgStore(async (text, params) => [...(await sql!.unsafe(text, (params ?? []) as never[]))] as Record<string, unknown>[], migration)
}
const app = await buildApp({ config, db, store })
if (!db) app.log.warn('DATABASE_URL تنظیم نشده؛ ذخیره‌سازی فایل آزمایشی است و با هر دیپلوی بدون Volume پاک می‌شود')

const stop = async () => { await app.close(); await db?.close(); await sql?.end({ timeout: 5 }); process.exit(0) }
process.on('SIGTERM', stop); process.on('SIGINT', stop)
await app.listen({ port: config.PORT, host: '0.0.0.0' })
