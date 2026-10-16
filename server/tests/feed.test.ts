import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { createAiService } from '../src/ai/service.js'
import { createFeedService } from '../src/feed/service.js'
import { FEED_KINDS, TOPICS, jalaliContext, tehranDate } from '../src/feed/schema.js'
import { createSecrets } from '../src/secrets.js'
import { createJsonStore } from '../src/store/jsonStore.js'
import * as Client from '../../src/feed/topics'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })
const content = (title: string) => ({ title, body: 'متن کامل کارت دربارهٔ یک نکتهٔ جالب سفر.', facts: [], image_queries: ['Test place'] })
const img = (n: number) => ({ url: `https://upload.example.org/${n}.jpg`, thumb_url: null, provider: 'manual', source_url: null, author: 'A', license: 'CC BY 4.0', license_url: null, attribution: 'A — CC BY 4.0' })

async function mkService(start = '2026-10-15T09:00:00Z') {
  let t = new Date(start)
  const store = await createJsonStore()
  const config = loadConfig({ NODE_ENV: 'test' })
  const ai = createAiService({ store, secrets: createSecrets(config, store), fetch: async () => json({}) })
  const feed = createFeedService({ store, ai, now: () => t })
  return { feed, setNow: (d: string) => { t = new Date(d) }, store }
}
/** کارتی که شرط ورود به صف را دارد */
async function ready(feed: Awaited<ReturnType<typeof mkService>>['feed'], title: string, kind: (typeof FEED_KINDS)[number] = 'dyk') {
  const it = await feed.create(kind, content(title), [{ title: 'منبع', url: 'https://example.org/s' }])
  await feed.addImages(it.id, [img(it.id)], { autoCover: true })
  return it
}

describe('هماهنگی با کلاینت', () => {
  it('شناسه و عنوان موضوع‌ها با src/feed/topics.ts یکی است', () => {
    expect([...FEED_KINDS]).toEqual([...Client.FEED_KINDS])
    for (const k of FEED_KINDS) expect(TOPICS[k].title).toBe(Client.FEED_TITLE[k])
  })
})

describe('تاریخ تهران', () => {
  it('نیمه‌شب تهران روز را عوض می‌کند (UTC+3:30)', () => {
    expect(tehranDate(new Date('2026-10-15T20:29:00Z'))).toBe('2026-10-15')
    expect(tehranDate(new Date('2026-10-15T20:31:00Z'))).toBe('2026-10-16')
    expect(jalaliContext(new Date('2026-10-15T09:00:00Z'))).toMatchObject({ month: 'مهر', season: 'پاییز', day: 23 })
  })
})

describe('صف و انتشار روزانه', () => {
  it('ورود به صف بدون تصویر یا بدون منبع مسدود است', async () => {
    const { feed } = await mkService()
    const a = await feed.create('dyk', content('الف'), [])
    let r = await feed.transition(a.id, 'queued'); expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/تصویر اصلی/); if (!r.ok) expect(r.errors.join(' ')).toMatch(/منبع/)
    await feed.addImages(a.id, [img(1)], { autoCover: true })
    r = await feed.transition(a.id, 'queued'); expect(r.ok).toBe(false) // هنوز بدون منبع
    await feed.update(a.id, { sources: [{ title: 'م', url: 'https://example.org' }] })
    r = await feed.transition(a.id, 'queued'); expect(r.ok).toBe(true)
  })

  it('هر روز یک کارت به ترتیب ورود به صف منتشر می‌شود و در همان روز تغییر نمی‌کند', async () => {
    const { feed, setNow } = await mkService()
    const [a, b, c] = [await ready(feed, 'الف'), await ready(feed, 'ب'), await ready(feed, 'ج')]
    for (const x of [a, b, c]) expect((await feed.transition(x.id, 'queued')).ok).toBe(true)
    expect((await feed.publicFeed()).items.dyk?.title).toBe('الف')
    expect((await feed.publicFeed()).items.dyk?.title).toBe('الف') // دوباره در همان روز
    setNow('2026-10-16T09:00:00Z'); expect((await feed.publicFeed()).items.dyk?.title).toBe('ب')
    setNow('2026-10-17T09:00:00Z'); expect((await feed.publicFeed()).items.dyk?.title).toBe('ج')
    expect((await feed.list('dyk', 'queued'))).toHaveLength(0)
  })

  it('وقتی صف خالی شد آخرین کارت منتشرشده می‌ماند و موضوع‌ها مستقل‌اند', async () => {
    const { feed, setNow } = await mkService()
    const a = await ready(feed, 'الف'), m = await ready(feed, 'حال‌وهوا', 'mood')
    await feed.transition(a.id, 'queued'); await feed.transition(m.id, 'queued')
    let f = await feed.publicFeed(); expect(f.items.dyk?.title).toBe('الف'); expect(f.items.mood?.title).toBe('حال‌وهوا'); expect(f.items.week).toBeUndefined()
    setNow('2026-10-20T09:00:00Z'); f = await feed.publicFeed(); expect(f.items.dyk?.title).toBe('الف')
  })

  it('خروجی عمومی فقط فیلدهای لازم را دارد (بدون وضعیت، دلیل رد، متای هوش مصنوعی)', async () => {
    const { feed } = await mkService()
    const a = await ready(feed, 'الف'); await feed.transition(a.id, 'queued')
    const it = (await feed.publicFeed()).items.dyk!
    expect(Object.keys(it).sort()).toEqual(['body', 'facts', 'id', 'image', 'kind', 'published_date', 'sources', 'title'])
    expect(it.sources).toEqual([{ title: 'منبع', url: 'https://example.org/s' }]); expect(it.image.license).toBe('CC BY 4.0')
  })

  it('انتشار فوری، لغو انتشار، رد با دلیل و حذف', async () => {
    const { feed } = await mkService()
    const a = await ready(feed, 'الف'); await feed.transition(a.id, 'queued')
    expect((await feed.remove(a.id)).ok).toBe(false) // در صف حذف نمی‌شود
    expect((await feed.transition(a.id, 'published')).ok).toBe(true)
    expect((await feed.publicFeed()).items.dyk?.title).toBe('الف')
    expect((await feed.transition(a.id, 'draft')).ok).toBe(true)
    expect((await feed.publicFeed()).items.dyk).toBeUndefined()
    expect((await feed.transition(a.id, 'rejected')).ok).toBe(false) // دلیل لازم است
    expect((await feed.transition(a.id, 'rejected', 'نامرتبط')).ok).toBe(true)
    expect((await feed.remove(a.id)).ok).toBe(true)
  })

  it('عنوان تکراری در صف/منتشرشده‌ها پذیرفته نمی‌شود', async () => {
    const { feed } = await mkService()
    const a = await ready(feed, 'نکتهٔ یکسان'), b = await ready(feed, 'نکتهٔ  یکسان!')
    expect((await feed.transition(a.id, 'queued')).ok).toBe(true)
    const r = await feed.transition(b.id, 'queued'); expect(r.ok).toBe(false)
  })
})

describe('تولید با هوش مصنوعی', () => {
  let app: FastifyInstance
  afterEach(async () => { await app?.close() })

  it('منبع وب + مدل + تصویر: پیش‌نویس با منابعِ استفاده‌شده و تصویر اصلی انتخاب‌شده', async () => {
    let prompt = ''
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('generativelanguage')) {
        prompt = JSON.parse(String(init?.body)).contents[0].parts[0].text
        return json({ candidates: [{ content: { parts: [{ text: JSON.stringify([
          { title: 'ماسوله', body: 'ماسوله روستایی پلکانی در گیلان است.', place: 'ماسوله', facts: [{ label: 'بهترین زمان', value: 'بهار' }], image_queries: ['Masuleh Iran'], source_refs: [1, 3] },
          { title: 'ماسوله', body: 'تکراری', source_refs: [] },
          { title: 'کندوان', body: 'روستای صخره‌ای کندوان.', image_queries: ['Kandovan'], source_refs: [] },
        ]) }] } }] })
      }
      if (u.includes('api.tavily.com')) { const q = JSON.parse(String(init?.body)).query as string; return json({ results: [{ title: `نتیجه ${q.slice(0, 6)}`, url: `https://site${q.length}.example/a`, content: 'متن' }, { title: 'دوم', url: `https://x${q.length}.example/b`, content: 'متن' }] }) }
      if (u.includes('commons.wikimedia.org')) return json({ query: { pages: [{ title: 'File:A.jpg', imageinfo: [{ url: 'https://upload.wikimedia.org/a.jpg', thumburl: 'https://upload.wikimedia.org/t.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', mime: 'image/jpeg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Ali' } } }] }] } })
      return json({}, 404)
    }) as typeof fetch
    app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/nonexistent', GEMINI_API_KEY: 'AIza-test-key-123456', TAVILY_API_KEY: 'tvly-test-key-123456' }), fetchImpl })
    await app.inject({ method: 'PUT', url: '/api/admin/settings/ai', payload: { llm: { primaryModel: 'gemini-test', fallbackModel: '', temperature: 0.3 }, webSearch: { enabled: true, provider: 'tavily', maxResults: 3 }, imageSearch: { providers: ['wikimedia'], maxPerProvider: 3 }, tasks: { generate: { useWebSearch: true }, images: { autoSearchOnGenerate: true } } } })

    const r = await app.inject({ method: 'POST', url: '/api/admin/feed/generate', payload: { kind: 'dyk', count: 3, hint: 'گیلان' } })
    expect(r.statusCode).toBe(200)
    const body = r.json(); expect(body.results.map((x: { ok: boolean }) => x.ok)).toEqual([true, false, true])
    expect(prompt).toContain('گیلان'); expect(prompt).toContain('[1]'); expect(prompt).toContain('عنوان‌های قبلی')

    const list = (await app.inject('/api/admin/feed/items?kind=dyk')).json().items as { id: number; status: string; sources: unknown[]; cover_image_id: number | null; cover_auto: boolean; blocking: string[]; content: { title: string } }[]
    expect(list).toHaveLength(2)
    const m = list.find((x) => x.content.title === 'ماسوله')!, k = list.find((x) => x.content.title === 'کندوان')!
    expect(m.status).toBe('draft'); expect(m.sources).toHaveLength(2); expect(m.cover_image_id).not.toBeNull(); expect(m.cover_auto).toBe(true); expect(m.blocking).toEqual([])
    expect(k.sources).toHaveLength(0); expect(k.blocking.join(' ')).toMatch(/منبع/) // بدون منبع نمی‌شود وارد صف کرد

    // تأیید ← صف ← انتشار فوری ← API عمومی
    expect((await app.inject({ method: 'POST', url: `/api/admin/feed/items/${k.id}/transition`, payload: { to: 'queued' } })).statusCode).toBe(409)
    expect((await app.inject({ method: 'POST', url: `/api/admin/feed/items/${m.id}/transition`, payload: { to: 'queued' } })).statusCode).toBe(200)
    const pub = (await app.inject('/api/feed')).json()
    expect(pub.items.dyk.title).toBe('ماسوله'); expect(pub.items.dyk.image.url).toContain('wikimedia'); expect(pub.items.dyk.sources).toHaveLength(2)
    expect(JSON.stringify(pub)).not.toContain('کندوان')
  })

  it('بدون کلید Gemini خطای روشن می‌دهد و چیزی ذخیره نمی‌شود', async () => {
    app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/nonexistent' }) })
    const r = await app.inject({ method: 'POST', url: '/api/admin/feed/generate', payload: { kind: 'mood', count: 1 } })
    expect(r.statusCode).toBe(502); expect(r.json().errors[0]).toMatch(/Gemini/)
    expect((await app.inject('/api/admin/feed/items?kind=mood')).json().items).toHaveLength(0)
  })

  it('ایجاد دستی، اعتبارسنجی و موضوع نامعتبر', async () => {
    app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/nonexistent' }) })
    expect((await app.inject({ method: 'POST', url: '/api/admin/feed/items', payload: { kind: 'dyk', content: { title: '' } } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/api/admin/feed/items', payload: { kind: 'nope', content: content('x') } })).statusCode).toBe(400)
    const ok = await app.inject({ method: 'POST', url: '/api/admin/feed/items', payload: { kind: 'week', content: content('هفته'), sources: [{ title: 'م', url: 'javascript:alert(1)' }] } })
    expect(ok.statusCode).toBe(400) // فقط http/https
    const made = await app.inject({ method: 'POST', url: '/api/admin/feed/items', payload: { kind: 'week', content: content('هفته'), sources: [{ title: 'م', url: 'https://example.org' }] } })
    expect(made.statusCode).toBe(201)
    const t = (await app.inject('/api/admin/feed/topics')).json().topics as { kind: string; counts: { draft: number } }[]
    expect(t).toHaveLength(9); expect(t.find((x) => x.kind === 'week')!.counts.draft).toBe(1)
  })
})
