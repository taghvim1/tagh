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
  days: [{ day: 1, title: 'رسیدن', plan: ['ارگ کریم‌خان', 'بازار وکیل'] }, { day: 2, title: 'تخت جمشید', plan: ['تخت جمشید'] }, { day: 3, title: 'بازگشت', plan: ['حافظیه'] }],
  cost: { items: [{ label: 'حمل‌ونقل', min: 2_000_000, max: 3_000_000 }, { label: 'اقامت', min: 3_000_000, max: 5_000_000, estimated: true }], note: 'قیمت بلیط از منابع' }, tips: ['پوشش محترمانه'], warnings: [], image_query: 'Shiraz Nasir al-Mulk Mosque', ...over,
})
const wiki = () => json({ query: { pages: [{ title: 'File:S.jpg', imageinfo: [{ url: 'https://upload.wikimedia.org/s.jpg', thumburl: 'https://upload.wikimedia.org/t.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:S.jpg', mime: 'image/jpeg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Ali' } } }] }] } })
const input = { origin: 'تهران', destination: 'شیراز', budget: 'متوسط', vehicle: 'هواپیما', trip_type: 'تاریخی', days: 3 }

async function mk(env: Record<string, string> = {}, f?: FetchFn) { app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x', ...env }), fetchImpl: f }); return app }
afterEach(async () => { await app?.close() })
const post = (url: string, payload?: unknown) => app.inject({ method: 'POST', url: `/api${url}`, payload: payload as object })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** طراحی پس‌زمینه است: کار را شروع می‌کنیم و تا پایان منتظر می‌مانیم */
async function design(body: unknown) {
  const r = await post('/package', body)
  if (r.statusCode !== 202) return { start: r, job: null as null | Record<string, any> }
  const id = r.json().job_id as string
  for (let i = 0; i < 50; i++) { const j = (await app.inject({ method: 'GET', url: `/api/package/jobs/${id}` })).json().job; if (j.status !== 'pending') return { start: r, job: j } ; await sleep(20) }
  throw new Error('timeout')
}

describe('پکیج تور', () => {
  it('طراحی در پس‌زمینه: شناسهٔ کار فوراً برمی‌گردد؛ نتیجه شامل چند تصویر، سایت‌های رزرو و جمع هزینهٔ محاسبه‌شدهٔ سرور است', async () => {
    const prompts: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string, init?: RequestInit) => {
      if (String(url).includes('generativelanguage')) { prompts.push(String(init?.body)); return gemini('```json\n' + JSON.stringify(pkg()) + '\n```') }
      return wiki()
    }) as FetchFn)
    const { start, job } = await design({ ...input, amount_toman: 20_000_000 })
    expect(start.statusCode).toBe(202); expect(start.body).not.toContain(KEY)
    expect(job!.status).toBe('done')
    const p = job!.package
    expect(p.content.days).toHaveLength(3); expect(p.content.cost).toMatchObject({ total_min: 5_000_000, total_max: 8_000_000 }) // مدل جمع نمی‌زند، سرور می‌زند
    expect(p.images.length).toBeGreaterThanOrEqual(1); expect(p.images[0]).toMatchObject({ license: 'CC BY-SA 4.0' }); expect(p.input.destination).toBe('شیراز')
    expect(p.booking.some((b: { url: string }) => b.url.startsWith('https://'))).toBe(true)
    expect(prompts[0]).toContain('شهر مقصد: شیراز'); expect(prompts[0]).toContain('هواپیما'); expect(prompts[0]).toContain('20,000,000'); expect(prompts[0]).toContain('تاریخی')
    expect(JSON.stringify(job)).not.toContain('push')
  })

  it('هشدار خودکار وقتی برآورد از بودجه بیشتر است؛ و تعداد روز نادرست دوباره درخواست می‌شود', async () => {
    let n = 0
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? (n++, gemini(JSON.stringify(n === 1 ? pkg({ days: [{ day: 1, title: 'a', plan: ['b'] }] }) : pkg()))) : wiki()) as FetchFn)
    const { job } = await design({ ...input, amount_toman: 3_000_000 })
    expect(n).toBe(2); expect(job!.status).toBe('done'); expect(job!.package.content.warnings[0]).toContain('بیشتر است')
  })

  it('ورودی نامعتبر رد می‌شود؛ نوع سفر باید از دسته‌های برنامه باشد؛ بدون کلید کار شکست می‌خورد؛ خروجی خراب → شکست', async () => {
    await mk()
    expect((await post('/package', { ...input, days: 0 })).statusCode).toBe(400)
    expect((await post('/package', { ...input, vehicle: 'موشک' })).statusCode).toBe(400)
    expect((await post('/package', { ...input, trip_type: 'خانوادگی' })).statusCode).toBe(400)
    expect((await design(input)).job).toMatchObject({ status: 'failed', error: 'not_configured' }) // (سقف ۴ درخواست در دقیقه برای هر IP)
    await app.close(); await mk()
    expect((await post('/package', { ...input, destination: '' })).statusCode).toBe(400)
    expect((await app.inject({ method: 'GET', url: '/api/package/jobs/xyz' })).statusCode).toBe(404)
    expect((await app.inject({ method: 'GET', url: '/api/package/jobs/6f1d3c0e-0000-4000-8000-000000000000' })).statusCode).toBe(404)
    await app.close()
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? gemini('خراب') : wiki()) as FetchFn)
    expect((await design(input)).job).toMatchObject({ status: 'failed', error: 'bad_output' })
  })

  it('اگر تصویری پیدا نشود پکیج بدون تصویر کامل می‌شود', async () => {
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string) => String(url).includes('generativelanguage') ? gemini(JSON.stringify(pkg())) : json({ query: { pages: [] } })) as FetchFn)
    const { job } = await design(input); expect(job!.status).toBe('done'); expect(job!.package.images).toEqual([])
  })

  it('اعلان Push فقط یک بار و بعد از اتمام کار فرستاده می‌شود و اشتراک پاک می‌شود', async () => {
    const { createJsonStore } = await import('../src/store/jsonStore.js'), { createPackageService } = await import('../src/package/service.js')
    const store = await createJsonStore(), sent: unknown[] = []
    const ai = { webSources: async () => ({ sources: [] }), llm: async () => ({ text: JSON.stringify(pkg()), model: 'm', fallback: false }), searchImageCandidates: async () => ({ items: [], errors: [] }) }
    const svc = createPackageService({ store, ai: ai as never, pusher: { publicKey: async () => 'k', send: async (s, p) => { sent.push([s, p]); return true } } })
    const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'x', auth: 'y' } }
    const r = await svc.start(input as never, sub); expect(r.ok).toBe(true)
    for (let i = 0; i < 50 && sent.length === 0; i++) await sleep(20)
    expect(sent).toHaveLength(1); expect((sent[0] as [unknown, { url: string; title: string }])[1]).toMatchObject({ title: 'پکیج تور آماده شد', url: expect.stringContaining('/package?job=') })
    expect(await store.getKV('package_jobs:v1')).not.toContain('push.example') // اشتراک بعد از ارسال حذف شده
    await store.close()
  })

  it('پنل: پرامپت پیش‌فرض، ذخیرهٔ سفارشی با اعتبارسنجی جاگذارها، بازنشانی، خاموش‌کردن و آزمایش', async () => {
    const seen: string[] = []
    await mk({ GEMINI_API_KEY: KEY }, (async (url: string, init?: RequestInit) => { if (String(url).includes('generativelanguage')) { seen.push(String(init?.body)); return gemini(JSON.stringify(pkg())) } return wiki() }) as FetchFn)
    const g = (await app.inject({ method: 'GET', url: '/api/admin/package' })).json()
    expect(g.prompt).toBe(DEFAULT_PACKAGE_PROMPT); expect(g.enabled).toBe(true); expect(g.placeholders).toContain('{{origin}}')
    const put = (body: unknown) => app.inject({ method: 'PUT', url: '/api/admin/package', payload: body as object })
    expect((await put({ enabled: true, prompt: 'x'.repeat(100) })).statusCode).toBe(400)
    const custom = 'پکیج بساز از {{origin}} به {{destination}} برای {{days}} روز. فقط JSON مطابق {{schema}} و منابع {{sources}}.'
    expect((await put({ enabled: true, prompt: custom })).statusCode).toBe(200)
    await design(input); expect(seen.at(-1)).toContain('پکیج بساز از تهران به شیراز برای 3 روز')
    expect((await put({ enabled: false, prompt: custom })).statusCode).toBe(200)
    expect((await post('/package', input)).statusCode).toBe(503)
    expect((await get('/package/options')).json()).toMatchObject({ enabled: false, push_key: expect.any(String) })
    expect((await post('/admin/package/test', input)).statusCode).toBe(200)
    expect((await post('/admin/package/reset')).json().prompt).toBe(DEFAULT_PACKAGE_PROMPT)
  })

  it('پرامپت پیش‌فرض همهٔ جاگذارهای لازم را دارد و رندر هیچ جاگذاری باقی نمی‌گذارد', () => {
    expect(validatePackagePrompt(DEFAULT_PACKAGE_PROMPT)).toEqual([])
    expect(renderPackagePrompt(DEFAULT_PACKAGE_PROMPT, input as never, [])).not.toMatch(/\{\{/)
  })
})
const get = (url: string) => app.inject({ method: 'GET', url: `/api${url}` })
