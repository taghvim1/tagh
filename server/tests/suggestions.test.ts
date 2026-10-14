import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { SCHEMA_TEXT } from '../src/ai/prompt.js'

const season = (r = 'good') => ({ rating: r, average_temperature: 20, temperature_min: 10, temperature_max: 30, weather_condition: 'معتدل', rainfall: 'low', humidity: 'low', priority: 0, description: 'خوب' })
const content = (over: Record<string, unknown> = {}) => ({ name: 'سنندج', country: 'ایران', province_or_city: 'کردستان', scope: 'domestic', type: ['طبیعت'], description: 'شهری در غرب ایران', duration: '۲ تا ۳ روز', budget: 'متوسط', companions: ['خانواده'], recommended_for: [], attractions: ['عمارت آصف'], visa_required: null, quality: 7, latitude: 35.31, longitude: 46.99, seasons: { spring: season('excellent'), summer: season(), autumn: season(), winter: season('acceptable') }, ...over })
const KEY = 'AIza-SECRET-KEY-1234'

let app: FastifyInstance
type FetchFn = typeof fetch
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })
const gemini = (text: string) => json({ candidates: [{ content: { parts: [{ text }] } }] })

async function mk(env: Record<string, string> = {}, fetchImpl?: FetchFn) {
  app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/nonexistent', ...env }), fetchImpl })
  return app
}
afterEach(async () => { await app?.close() })
const post = (path: string, payload?: unknown) => app.inject({ method: 'POST', url: `/api${path}`, payload: payload as object })
const get = (path: string) => app.inject({ method: 'GET', url: `/api${path}` })
const create = async (c = content()) => (await post('/admin/suggestions', { content: c })).json().suggestion as { id: number; version: number }
const addApprovedImage = async (id: number) => {
  const img = (await post(`/admin/suggestions/${id}/images`, { url: 'https://example.org/a.jpg', license: 'CC BY 4.0', author: 'A' })).json().image
  await post(`/admin/images/${img.id}/decision`, { status: 'approved' }); return img.id as number
}

describe('گردش وضعیت پیشنهاد', () => {
  it('ایجاد → نسخهٔ ۱ و اعتبارسنجی ورودی', async () => {
    await mk()
    expect((await post('/admin/suggestions', { content: { name: 'x' } })).statusCode).toBe(400)
    const s = await create(); expect(s.version).toBe(1)
    const d = (await get(`/admin/suggestions/${s.id}`)).json(); expect(d.versions).toHaveLength(1); expect(d.suggestion.status).toBe('draft')
  })
  it('انتقال غیرمجاز، رد بدون دلیل و انتشار بدون تصویر تأییدشده مسدود است', async () => {
    await mk(); const s = await create()
    expect((await post(`/admin/suggestions/${s.id}/transition`, { to: 'published' })).statusCode).toBe(409)
    await post(`/admin/suggestions/${s.id}/transition`, { to: 'pending_review' })
    expect((await post(`/admin/suggestions/${s.id}/transition`, { to: 'rejected' })).statusCode).toBe(400)
    expect((await post(`/admin/suggestions/${s.id}/transition`, { to: 'rejected', reason: 'نادقیق' })).statusCode).toBe(200)
    await post(`/admin/suggestions/${s.id}/transition`, { to: 'draft' })
    await post(`/admin/suggestions/${s.id}/transition`, { to: 'pending_review' }); await post(`/admin/suggestions/${s.id}/transition`, { to: 'approved' })
    const r = await post(`/admin/suggestions/${s.id}/transition`, { to: 'published' })
    expect(r.statusCode).toBe(409); expect(r.json().errors[0]).toMatch(/تصویر/)
  })
  it('انتشار با تصویر تأییدشده؛ فقط منتشرشده‌ها در API عمومی و بدون فیلد داخلی', async () => {
    await mk(); const s = await create(); const draft = await create(content({ name: 'مریوان' }))
    await addApprovedImage(s.id); await addApprovedImage(draft.id)
    for (const to of ['pending_review', 'approved', 'published']) expect((await post(`/admin/suggestions/${s.id}/transition`, { to })).statusCode).toBe(200)
    const pub = (await get('/travel-suggestions')).json().items
    expect(pub).toHaveLength(1); expect(pub[0].content.name).toBe('سنندج'); expect(pub[0].image.license).toBe('CC BY 4.0')
    expect(JSON.stringify(pub)).not.toMatch(/reject_reason|ai_meta|status/)
  })
  it('ویرایش با نسخه‌گذاری، تعارض هم‌زمانی و لغو انتشار هنگام ویرایش', async () => {
    await mk(); const s = await create(); await addApprovedImage(s.id)
    for (const to of ['pending_review', 'approved', 'published']) await post(`/admin/suggestions/${s.id}/transition`, { to })
    const r = await app.inject({ method: 'PATCH', url: `/api/admin/suggestions/${s.id}`, payload: { content: content({ description: 'متن تازه' }), expected_version: 1 } })
    expect(r.json().unpublished).toBe(true); expect(r.json().suggestion.version).toBe(2); expect(r.json().suggestion.status).toBe('approved')
    expect((await get('/travel-suggestions')).json().items).toHaveLength(0)
    const stale = await app.inject({ method: 'PATCH', url: `/api/admin/suggestions/${s.id}`, payload: { content: content(), expected_version: 1 } })
    expect(stale.statusCode).toBe(409)
    expect((await get(`/admin/suggestions/${s.id}`)).json().versions.map((v: { version: number }) => v.version)).toEqual([2, 1])
  })
  it('هشدار تکراری و جلوگیری از انتشار دوم با همان نام/کشور', async () => {
    await mk(); const a = await create(); const r = await post('/admin/suggestions', { content: content() })
    expect(r.json().duplicates).toHaveLength(1)
    const b = r.json().suggestion.id as number
    await addApprovedImage(a.id); await addApprovedImage(b)
    for (const to of ['pending_review', 'approved', 'published']) await post(`/admin/suggestions/${a.id}/transition`, { to })
    for (const to of ['pending_review', 'approved']) await post(`/admin/suggestions/${b}/transition`, { to })
    expect((await post(`/admin/suggestions/${b}/transition`, { to: 'published' })).statusCode).toBe(409)
  })
  it('تصویر بدون مجوز اضافه/تأیید نمی‌شود و جست‌وجو/فیلتر کار می‌کند', async () => {
    await mk(); const s = await create(); await create(content({ name: 'کیش', country: 'ایران', province_or_city: 'هرمزگان', scope: 'domestic' }))
    expect((await post(`/admin/suggestions/${s.id}/images`, { url: 'https://example.org/a.jpg' })).statusCode).toBe(400)
    expect((await post(`/admin/suggestions/${s.id}/images`, { url: 'http://insecure.org/a.jpg', license: 'x' })).statusCode).toBe(400)
    const l = (await get('/admin/suggestions?q=کیش')).json(); expect(l.total).toBe(1); expect(l.counts.all).toBe(1)
    expect((await get('/admin/suggestions?status=published')).json().total).toBe(0)
  })
})

describe('دسترسی مدیر', () => {
  it('production بدون توکن غیرفعال؛ با توکن فقط درخواست دارای توکن', async () => {
    await mk({ NODE_ENV: 'production' }); expect((await get('/admin/suggestions')).statusCode).toBe(503); expect((await get('/admin/mode')).json().mode).toBe('disabled'); await app.close()
    await mk({ NODE_ENV: 'production', ADMIN_TOKEN: 'a'.repeat(20) })
    expect((await get('/admin/suggestions')).statusCode).toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/admin/suggestions', headers: { authorization: `Bearer ${'a'.repeat(20)}` } })).statusCode).toBe(200)
    expect((await get('/travel-suggestions')).statusCode).toBe(200) // عمومی
  })
})

describe('کلیدهای API', () => {
  it('کلید محیطی: فقط نقاب‌دار برمی‌گردد و هیچ پاسخی کلید کامل ندارد', async () => {
    await mk({ GEMINI_API_KEY: KEY })
    const r = await get('/admin/settings/secrets'); expect(r.json().secrets.gemini).toMatchObject({ configured: true, source: 'env', masked: '••••1234' })
    expect(r.body).not.toContain(KEY); expect((await get('/admin/settings/ai')).body).not.toContain(KEY)
  })
  it('ذخیره از رابط: بدون SECRETS_ENCRYPTION_KEY رد و با آن رمزنگاری‌شده؛ در production بدون توکن مسدود', async () => {
    await mk(); const no = await app.inject({ method: 'PUT', url: '/api/admin/settings/secrets/gemini', payload: { value: KEY } })
    expect(no.statusCode).toBe(409); expect(no.json().reason).toBe('needs_encryption_key'); expect(no.body).not.toContain(KEY); await app.close()
    await mk({ SECRETS_ENCRYPTION_KEY: 'x'.repeat(24) })
    const ok = await app.inject({ method: 'PUT', url: '/api/admin/settings/secrets/gemini', payload: { value: KEY } })
    expect(ok.statusCode).toBe(200); expect(ok.json().status).toMatchObject({ source: 'ui', masked: '••••1234' }); expect(ok.body).not.toContain(KEY)
    await app.inject({ method: 'DELETE', url: '/api/admin/settings/secrets/gemini' })
    expect((await get('/admin/settings/secrets')).json().secrets.gemini.configured).toBe(false); await app.close()
    await mk({ NODE_ENV: 'production', ADMIN_OPEN: 'true', SECRETS_ENCRYPTION_KEY: 'x'.repeat(24), DATA_DIR: mkdtempSync(join(tmpdir(), 'data-')) })
    // production با ADMIN_OPEN=true (حالت آگاهانهٔ تست): ذخیرهٔ کلید از رابط مجاز است
    const open = await app.inject({ method: 'PUT', url: '/api/admin/settings/secrets/gemini', payload: { value: KEY } }); expect(open.statusCode).toBe(200); expect(open.body).not.toContain(KEY)
    expect((await get('/admin/settings/secrets')).json().setup).toMatchObject({ admin_open: true, admin_token: false, encryption_key: true, storage: 'file' }); await app.close()
    // production بدون ADMIN_TOKEN و بدون ADMIN_OPEN: کل API مدیر بسته است
    await mk({ NODE_ENV: 'production', SECRETS_ENCRYPTION_KEY: 'x'.repeat(24), DATA_DIR: mkdtempSync(join(tmpdir(), 'data-')) })
    expect((await app.inject({ method: 'PUT', url: '/api/admin/settings/secrets/gemini', payload: { value: KEY } })).statusCode).toBe(503)
  })
  it('آزمون اتصال: کلید نامعتبر پیام فارسی بدون کلید می‌دهد', async () => {
    await mk({ GEMINI_API_KEY: KEY }, (async () => json({ error: { message: 'API key not valid' } }, 400)) as FetchFn)
    const r = (await post('/admin/settings/test/gemini')).json(); expect(r.ok).toBe(false); expect(r.message).toMatch(/نامعتبر/); expect(JSON.stringify(r)).not.toContain(KEY)
  })
})

describe('تولید با هوش مصنوعی', () => {
  it('بدون کلید Gemini خطای روشن می‌دهد و چیزی نمی‌سازد', async () => {
    await mk(); const r = (await post('/admin/ai/generate', { names: ['سنندج'] })).json().results[0]
    expect(r.ok).toBe(false); expect(r.errors[0]).toMatch(/Gemini/); expect((await get('/admin/suggestions')).json().total).toBe(0)
  })
  it('خروجی معتبر → پیش‌نویس + نامزد تصویر (بدون تأیید خودکار)؛ ادعای منبع/مدل ثبت می‌شود', async () => {
    const calls: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => {
      calls.push(String(url))
      if (String(url).includes('generativelanguage')) return gemini('```json\n' + JSON.stringify(content()) + '\n```')
      return json({ query: { pages: [{ title: 'File:S.jpg', imageinfo: [{ url: 'https://upload.wikimedia.org/s.jpg', thumburl: 'https://upload.wikimedia.org/t.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:S.jpg', mime: 'image/jpeg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: '<a href="x">Ali</a>' } } }, { title: 'File:NoLicense.jpg', imageinfo: [{ url: 'https://upload.wikimedia.org/n.jpg', mime: 'image/jpeg', extmetadata: {} }] }] }] } })
    }) as FetchFn)
    const r = (await post('/admin/ai/generate', { names: ['سنندج'] })).json().results[0]
    expect(r.ok).toBe(true); expect(r.images_added).toBe(1); expect(r.meta.model).toBe('gemini-2.5-flash')
    const d = (await get(`/admin/suggestions/${r.id}`)).json()
    expect(d.suggestion.source).toBe('ai'); expect(d.suggestion.status).toBe('draft'); expect(d.images[0]).toMatchObject({ status: 'candidate', license: 'CC BY-SA 4.0', author: 'Ali', provider: 'wikimedia' })
    expect(d.suggestion.cover_image_id).toBeNull(); expect(d.publish_check.blocking.length).toBeGreaterThan(0)
  })
  it('خروجی نامعتبر یک بار اصلاح می‌شود؛ اگر باز نامعتبر بود ذخیره نمی‌شود', async () => {
    let n = 0
    await mk({ GEMINI_API_KEY: KEY }, (async () => { n++; return gemini(n === 1 ? '{"name":"x"}' : JSON.stringify(content())) }) as FetchFn)
    expect((await post('/admin/ai/test-generation', { name: 'سنندج' })).json().ok).toBe(true); expect(n).toBe(2); await app.close()
    n = 0; await mk({ GEMINI_API_KEY: KEY }, (async () => { n++; return gemini('نه JSON') }) as FetchFn)
    const r = (await post('/admin/ai/generate', { names: ['سنندج'] })).json().results[0]
    expect(r.ok).toBe(false); expect(n).toBe(2); expect((await get('/admin/suggestions')).json().total).toBe(0)
  })
  it('مدل جایگزین هنگام خطای مدل اصلی؛ کلید نامعتبر جایگزین ندارد', async () => {
    const used: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => { used.push(String(url).match(/models\/([^:]+)/)![1]); return used.length === 1 ? json({}, 503) : gemini(JSON.stringify(content())) }) as FetchFn)
    const r = (await post('/admin/ai/test-generation', { name: 'سنندج' })).json(); expect(r.ok).toBe(true); expect(r.meta.used_fallback).toBe(true); expect(used).toEqual(['gemini-2.5-flash', 'gemini-2.5-flash-lite']); await app.close()
    used.length = 0; await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => { used.push(String(url)); return json({}, 403) }) as FetchFn)
    expect((await post('/admin/ai/test-generation', { name: 'سنندج' })).json().ok).toBe(false); expect(used).toHaveLength(1)
  })
  it('قالب پرامپت نسخه‌دار: اعتبارسنجی جاگذار، فعال‌سازی، و استفاده در تولید', async () => {
    let prompt = ''
    await mk({ GEMINI_API_KEY: KEY }, (async (_u: string, init: RequestInit) => { prompt = JSON.parse(init.body as string).contents[0].parts[0].text; return gemini(JSON.stringify(content())) }) as FetchFn)
    expect((await post('/admin/prompts', { text: 'x'.repeat(40) })).statusCode).toBe(400)
    const p = (await post('/admin/prompts', { text: `مقصد: {{names}}\nقالب خاص\n{{schema}}`, note: 'v1' })).json().prompt
    expect(p.version).toBe(1); await post(`/admin/prompts/${p.id}/activate`)
    const r = (await post('/admin/ai/test-generation', { name: 'سنندج' })).json(); expect(prompt).toContain('قالب خاص'); expect(prompt).toContain('سنندج'); expect(r.meta.prompt_version).toBe(1)
    expect(SCHEMA_TEXT).toContain('seasons')
  })
})
