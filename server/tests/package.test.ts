import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { DEFAULT_PACKAGE_PROMPT, renderPackagePrompt, validatePackagePrompt } from '../src/package/prompt.js'

const KEY = 'AIza-SECRET-KEY-1234'
let app: FastifyInstance
type FetchFn = typeof fetch
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })
const gemini = (text: string) => json({ candidates: [{ content: { parts: [{ text }] } }] })
const pkg = (over: Record<string, unknown> = {}) => ({
  title: 'سه روز شیراز', summary: 'سفری فرهنگی به شیراز.', transport: 'پرواز تهران–شیراز حدود ۱ ساعت.',
  days: [{ day: 1, title: 'رسیدن', plan: ['ارگ کریم‌خان', 'بازار وکیل'], stay: 'هتل' }, { day: 2, title: 'تخت جمشید', plan: ['تخت جمشید'] }, { day: 3, title: 'بازگشت', plan: ['حافظیه'] }],
  cost: { total: '۱۰ تا ۱۵ میلیون تومان', breakdown: ['اقامت: ۵ میلیون'] }, tips: ['پوشش محترمانه'], warnings: [], image_query: 'Shiraz Nasir al-Mulk Mosque', ...over,
})
const wiki = () => json({ query: { pages: [{ title: 'File:S.jpg', imageinfo: [{ url: 'https://upload.wikimedia.org/s.jpg', thumburl: 'https://upload.wikimedia.org/t.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:S.jpg', mime: 'image/jpeg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Ali' } } }] }] } })
const input = { origin: 'تهران', destination: 'شیراز', budget: 'متوسط', vehicle: 'هواپیما', trip_type: 'فرهنگی و تاریخی', days: 3 }

async function mk(env: Record<string, string> = {}, f?: FetchFn) { app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x', ...env }), fetchImpl: f }); return app }
afterEach(async () => { await app?.close() })
const post = (url: string, payload?: unknown) => app.inject({ method: 'POST', url: `/api${url}`, payload: payload as object })

describe('پکیج تور', () => {
  it('طراحی موفق: برنامه + تصویر دارای مجوز + بدون نشت کلید؛ پرامپت شامل ورودی‌ها', async () => {
    const prompts: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string, init?: RequestInit) => {
      if (String(url).includes('generativelanguage')) { prompts.push(String(init?.body)); return gemini('```json\n' + JSON.stringify(pkg()) + '\n```') }
      return wiki()
    }) as FetchFn)
    const r = await post('/package', { ...input, amount_toman: 20_000_000 })
    expect(r.statusCode).toBe(200)
    const p = r.json().package
    expect(p.content.days).toHaveLength(3); expect(p.image).toMatchObject({ url: expect.stringContaining('https://'), license: 'CC BY-SA 4.0' }); expect(p.input.destination).toBe('شیراز')
    expect(prompts[0]).toContain('شهر مقصد: شیراز'); expect(prompts[0]).toContain('هواپیما'); expect(prompts[0]).toContain('20,000,000')
    expect(r.body).not.toContain(KEY)
  })

  it('ورودی نامعتبر رد می‌شود؛ خروجی ناقص یک بار اصلاح می‌شود؛ بدون کلید ۵۰۳', async () => {
    await mk()
    expect((await post('/package', { ...input, days: 0 })).statusCode).toBe(400)
    expect((await post('/package', { ...input, vehicle: 'موشک' })).statusCode).toBe(400)
    expect((await post('/package', { ...input, destination: '' })).statusCode).toBe(400)
    expect((await post('/package', input)).statusCode).toBe(503)
    await app.close()
    let n = 0
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? (n++, gemini(n === 1 ? '{"title":"x"}' : JSON.stringify(pkg()))) : wiki()) as FetchFn)
    expect((await post('/package', input)).statusCode).toBe(200); expect(n).toBe(2)
    await app.close()
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? gemini('خراب') : wiki()) as FetchFn)
    expect((await post('/package', input)).statusCode).toBe(502)
  })

  it('اگر تصویری پیدا نشود پکیج بدون تصویر برمی‌گردد (خطا نیست)', async () => {
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? gemini(JSON.stringify(pkg())) : json({ query: { pages: [] } })) as FetchFn)
    const r = await post('/package', input); expect(r.statusCode).toBe(200); expect(r.json().package.image).toBeNull()
  })

  it('پنل: پرامپت پیش‌فرض، ذخیرهٔ سفارشی با اعتبارسنجی جاگذارها، بازنشانی، خاموش‌کردن و آزمایش', async () => {
    const seen: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string, init?: RequestInit) => { if (String(url).includes('generativelanguage')) { seen.push(String(init?.body)); return gemini(JSON.stringify(pkg())) } return wiki() }) as FetchFn)
    const g = (await app.inject({ method: 'GET', url: '/api/admin/package' })).json()
    expect(g.prompt).toBe(DEFAULT_PACKAGE_PROMPT); expect(g.enabled).toBe(true); expect(g.placeholders).toContain('{{origin}}')
    const put = (body: unknown) => app.inject({ method: 'PUT', url: '/api/admin/package', payload: body as object })
    expect((await put({ enabled: true, prompt: 'x'.repeat(100) })).statusCode).toBe(400) // جاگذار ندارد
    const custom = 'پکیج بساز از {{origin}} به {{destination}} برای {{days}} روز. فقط JSON مطابق {{schema}} و منابع {{sources}}.'
    expect((await put({ enabled: true, prompt: custom })).statusCode).toBe(200)
    await post('/package', input); expect(seen.at(-1)).toContain('پکیج بساز از تهران به شیراز برای 3 روز')
    expect((await put({ enabled: false, prompt: custom })).statusCode).toBe(200)
    expect((await post('/package', input)).statusCode).toBe(503)
    expect((await get('/package/options')).json().enabled).toBe(false)
    expect((await post('/admin/package/test', input)).statusCode).toBe(200) // مدیر همیشه می‌تواند آزمایش کند
    expect((await post('/admin/package/reset')).json().prompt).toBe(DEFAULT_PACKAGE_PROMPT)
  })

  it('پرامپت پیش‌فرض همهٔ جاگذارهای لازم را دارد و رندر هیچ جاگذاری باقی نمی‌گذارد', () => {
    expect(validatePackagePrompt(DEFAULT_PACKAGE_PROMPT)).toEqual([])
    expect(renderPackagePrompt(DEFAULT_PACKAGE_PROMPT, input as never, [])).not.toMatch(/\{\{/)
  })
})
const get = (url: string) => app.inject({ method: 'GET', url: `/api${url}` })
