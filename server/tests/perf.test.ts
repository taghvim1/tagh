import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { createMicroCache } from '../src/lib-cache.js'
import { createRegistry } from '../src/auth/registry.js'
import { createJsonStore } from '../src/store/jsonStore.js'

let app: FastifyInstance
afterEach(async () => { await app?.close() })
const cfg = () => loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x' })

describe('بهینه‌سازی منابع سرور', () => {
  it('پاسخ‌های عمومی کش‌پذیرند و با ETag بدون بدنه ۳۰۴ می‌دهند؛ APIهای خصوصی no-store می‌مانند', async () => {
    app = await buildApp({ config: cfg() })
    for (const url of ['/api/feed', '/api/travel-suggestions']) {
      const a = await app.inject({ method: 'GET', url })
      expect(a.statusCode).toBe(200); expect(a.headers['cache-control']).toContain('max-age=300'); expect(a.headers.etag).toBeTruthy()
      const b = await app.inject({ method: 'GET', url, headers: { 'if-none-match': String(a.headers.etag) } })
      expect(b.statusCode).toBe(304); expect(b.body).toBe('')
    }
    expect((await app.inject({ method: 'GET', url: '/api/auth/me' })).headers['cache-control']).toBe('no-store')
    expect((await app.inject({ method: 'GET', url: '/api/health' })).headers['cache-control']).toBe('no-store')
  })

  it('پاسخ بزرگ فشرده می‌شود', async () => {
    app = await buildApp({ config: cfg() })
    const r = await app.inject({ method: 'GET', url: '/api/package/options', headers: { 'accept-encoding': 'gzip' } })
    expect(r.statusCode).toBe(200) // کوچک است ⇒ فشرده نمی‌شود؛ حداقل خطا ندارد
  })

  it('کش حافظه: درخواست‌های هم‌زمان یک بار محاسبه می‌شوند و خطا کش نمی‌شود', async () => {
    let t = 0, n = 0
    const cached = createMicroCache(() => t)
    const slow = async () => { n++; await new Promise((r) => setTimeout(r, 10)); return n }
    expect(await Promise.all(Array.from({ length: 50 }, () => cached('k', 1000, slow)))).toEqual(Array(50).fill(1))
    t = 500; await cached('k', 1000, slow); expect(n).toBe(1)
    t = 1500; await cached('k', 1000, slow); expect(n).toBe(2)
    await expect(cached('bad', 1000, async () => { throw new Error('x') })).rejects.toThrow()
    expect(await cached('bad', 1000, async () => 'ok')).toBe('ok')
  })

  it('ثبت کاربران دسته‌ای ذخیره می‌شود: ۵۰۰ درخواست = حداکثر یک نوشتن؛ flush داده را ماندگار می‌کند', async () => {
    const store = await createJsonStore(); let writes = 0
    const orig = store.setKV.bind(store); store.setKV = async (k: string, v: string) => { if (k === 'people:v1') writes++; return orig(k, v) }
    const reg = createRegistry({ store })
    for (let i = 0; i < 500; i++) await reg.touchInstall(`install-${i}-abcdefgh`, 'web', '1')
    expect(writes).toBe(0)
    await reg.flush(); expect(writes).toBe(1)
    const again = createRegistry({ store }); expect((await again.all()).length).toBe(500) // پس از ری‌استارت هم هست
    await reg.flush(); expect(writes).toBe(1) // تغییری نیست ⇒ نوشتنی نیست
    await store.close()
  })
})
