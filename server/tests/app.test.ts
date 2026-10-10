import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'

const site = () => {
  const d = mkdtempSync(join(tmpdir(), 'site-')); mkdirSync(join(d, 'assets'))
  writeFileSync(join(d, 'index.html'), '<!doctype html><div id=root></div>'); writeFileSync(join(d, 'sw.js'), '//sw'); writeFileSync(join(d, 'assets', 'a-1.js'), '1')
  return d
}
const cfg = (extra: Record<string, string> = {}) => loadConfig({ NODE_ENV: 'test', STATIC_DIR: site(), ...extra })

describe('سرور', () => {
  it('health بدون دیتابیس 200 است', async () => {
    const app = await buildApp({ config: cfg() })
    const r = await app.inject('/api/health')
    expect(r.statusCode).toBe(200); expect(r.json()).toEqual({ status: 'ok' }); expect(r.headers['cache-control']).toBe('no-store')
  })
  it('ready: بدون دیتابیس 503 با وضعیت روشن (بدون جزئیات اتصال)', async () => {
    const r = await (await buildApp({ config: cfg() })).inject('/api/ready')
    expect(r.statusCode).toBe(503); expect(r.json()).toEqual({ status: 'degraded', db: 'not_configured' })
  })
  it('ready: دیتابیس سالم 200 و دیتابیس قطع 503 بدون نشت خطا', async () => {
    const up = await (await buildApp({ config: cfg(), db: { ping: async () => undefined, close: async () => undefined } })).inject('/api/ready')
    expect(up.statusCode).toBe(200); expect(up.json().db).toBe('up')
    const down = await (await buildApp({ config: cfg(), db: { ping: async () => { throw new Error('password=secret host=x') }, close: async () => undefined } })).inject('/api/ready')
    expect(down.statusCode).toBe(503); expect(JSON.stringify(down.json())).not.toContain('secret')
  })
  it('مسیر ناموجود API یک 404 JSON است نه HTML', async () => {
    const r = await (await buildApp({ config: cfg() })).inject('/api/nope')
    expect(r.statusCode).toBe(404); expect(r.headers['content-type']).toContain('json')
  })
  it('مسیرهای SPA (مثل /admin) index.html می‌دهند و فایل ناموجود 404 است', async () => {
    const app = await buildApp({ config: cfg() })
    const a = await app.inject('/admin/users'); expect(a.statusCode).toBe(200); expect(a.body).toContain('id=root')
    const m = await app.inject('/assets/AdminApp-old.js'); expect(m.statusCode).toBe(404)
  })
  it('هدرهای کش: assets بلندمدت، sw.js و index.html no-cache', async () => {
    const app = await buildApp({ config: cfg() })
    expect((await app.inject('/assets/a-1.js')).headers['cache-control']).toContain('immutable')
    expect((await app.inject('/sw.js')).headers['cache-control']).toBe('no-cache')
    expect((await app.inject('/')).headers['cache-control']).toBe('no-cache')
  })
  it('اعتبارسنجی پیکربندی: PORT نامعتبر رد می‌شود', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow()
    expect(loadConfig({}).DATABASE_URL).toBeUndefined()
  })
})
