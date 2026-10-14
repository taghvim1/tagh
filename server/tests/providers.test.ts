import { describe, expect, it } from 'vitest'
import { tavilySearch, unsplashImages } from '../src/ai/providers.js'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })

describe('Tavily و Unsplash', () => {
  it('Tavily: درخواست POST با Bearer و تبدیل نتایج', async () => {
    let seen: { url: string; init: RequestInit } | null = null
    const f = (async (url: string, init: RequestInit) => { seen = { url, init }; return json({ results: [{ title: 'T', url: 'https://a.org', content: '<b>x</b> متن' }, { title: 'bad', url: 'javascript:1', content: '' }] }) }) as unknown as typeof fetch
    const r = await tavilySearch(f, 'tvly-k', 'q', 3)
    expect(r).toEqual([{ title: 'T', url: 'https://a.org', snippet: 'x متن' }])
    expect(seen!.url).toBe('https://api.tavily.com/search')
    expect((seen!.init.headers as Record<string, string>).authorization).toBe('Bearer tvly-k')
    expect(JSON.parse(seen!.init.body as string)).toMatchObject({ query: 'q', max_results: 3 })
  })
  it('Unsplash: Client-ID، اعتبار عکاس و مجوز', async () => {
    let auth = ''
    const f = (async (_u: string, init: RequestInit) => { auth = (init.headers as Record<string, string>).authorization; return json({ results: [{ urls: { regular: 'https://images.unsplash.com/r', small: 'https://images.unsplash.com/s' }, links: { html: 'https://unsplash.com/photos/x' }, user: { name: 'Ali' } }, { urls: { regular: 'http://insecure/x' } }] }) }) as unknown as typeof fetch
    const r = await unsplashImages(f, 'KEY', 'isfahan', 5)
    expect(auth).toBe('Client-ID KEY')
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ provider: 'unsplash', author: 'Ali', license: 'Unsplash License', attribution: 'Ali — Unsplash' })
    expect(r[0].source_url).toContain('utm_source=')
  })
  it('کلید نامعتبر → خطای invalid_key بدون درز کلید', async () => {
    const f = (async () => json({}, 401)) as unknown as typeof fetch
    await expect(unsplashImages(f, 'SECRET123', 'q', 1)).rejects.toMatchObject({ code: 'invalid_key' })
    await expect(tavilySearch(f, 'SECRET123', 'q', 1)).rejects.not.toThrow(/SECRET123/)
  })
})
