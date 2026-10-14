import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { createJsonStore } from '../src/store/jsonStore.js'
import { createPgStore } from '../src/store/pgStore.js'
import type { Store, SuggestionRow } from '../src/store/types.js'

const SQL = readFileSync(new URL('../migrations/001_init.sql', import.meta.url), 'utf8')
const season = { rating: 'good', average_temperature: 20, temperature_min: 10, temperature_max: 30, weather_condition: 'معتدل', rainfall: 'low', humidity: 'low', priority: 0, description: 'خوب' }
const content = (name: string, over: Record<string, unknown> = {}) => ({ name, country: 'ایران', province_or_city: 'کردستان', scope: 'domestic', type: ['طبیعت'], description: 'شهری در غرب ایران', duration: '۲ تا ۳ روز', budget: 'متوسط', companions: ['خانواده'], recommended_for: [], attractions: ['عمارت'], visa_required: null, quality: 7, latitude: 35.3, longitude: 46.9, seasons: { spring: season, summer: season, autumn: season, winter: season }, ...over })
const row = (name: string, over: Partial<SuggestionRow> = {}): Omit<SuggestionRow, 'id'> => ({ status: 'draft', source: 'manual', name, country: 'ایران', content: content(name) as never, version: 1, cover_image_id: null, reject_reason: null, ai_meta: null, created_at: '2026-10-14T08:00:00.000Z', updated_at: '2026-10-14T08:00:00.000Z', published_at: null, ...over })

const makers: Record<string, () => Promise<Store>> = {
  json: () => createJsonStore(),
  postgres: async () => { const db = new PGlite(); return createPgStore(async (t, p) => (await db.query(t, p as never[])).rows as Record<string, unknown>[], SQL) },
}

for (const [label, mk] of Object.entries(makers)) {
  describe(`Store (${label})`, () => {
    let store: Store
    afterEach(async () => { await store?.close() })

    it('پیشنهاد: درج، خواندن، به‌روزرسانی (JSON/تاریخ/null)، حذف با زیرمجموعه‌ها', async () => {
      store = await mk()
      const a = await store.insertSuggestion(row('سنندج'))
      expect(a.id).toBeGreaterThan(0); expect(a.content.name).toBe('سنندج'); expect(a.created_at).toBe('2026-10-14T08:00:00.000Z')
      const u = await store.updateSuggestion(a.id, { status: 'published', published_at: '2026-10-14T09:00:00.000Z', ai_meta: { sources: [{ title: 't', url: 'https://x.org' }] }, content: content('سنندج', { quality: 9 }) as never, cover_image_id: null })
      expect(u!.status).toBe('published'); expect(u!.published_at).toBe('2026-10-14T09:00:00.000Z'); expect(u!.ai_meta!.sources[0].url).toBe('https://x.org'); expect(u!.content.quality).toBe(9)
      expect(await store.updateSuggestion(9999, { name: 'x' })).toBeNull()
      await store.addVersion({ suggestion_id: a.id, version: 1, content: a.content, note: 'n', created_at: a.created_at })
      const img = await store.addImage({ suggestion_id: a.id, url: 'https://e.org/1.jpg', thumb_url: null, provider: 'pexels', source_url: null, author: 'A', license: 'CC0', license_url: null, attribution: null, status: 'candidate', created_at: a.created_at, decided_at: null })
      const approved = await store.updateImage(img.id, { status: 'approved', decided_at: '2026-10-14T10:00:00.000Z' })
      expect(approved!.status).toBe('approved'); expect(approved!.decided_at).toBe('2026-10-14T10:00:00.000Z'); expect((await store.listImages(a.id))).toHaveLength(1)
      expect(await store.deleteSuggestion(a.id)).toBe(true)
      expect(await store.getSuggestion(a.id)).toBeNull(); expect(await store.listVersions(a.id)).toHaveLength(0); expect(await store.listImages(a.id)).toHaveLength(0)
      expect(await store.deleteSuggestion(a.id)).toBe(false)
    })

    it('فهرست: فیلتر وضعیت/حوزه/جست‌وجو، شمارنده‌ها، مرتب‌سازی و صفحه‌بندی', async () => {
      store = await mk()
      await store.insertSuggestion(row('الف', { status: 'draft', updated_at: '2026-10-14T08:00:01.000Z' }))
      await store.insertSuggestion(row('ب', { status: 'approved', updated_at: '2026-10-14T08:00:02.000Z' }))
      await store.insertSuggestion(row('پاریس', { status: 'approved', country: 'فرانسه', content: content('پاریس', { scope: 'international', country: 'فرانسه', province_or_city: 'ایل‌دوفرانس' }) as never, updated_at: '2026-10-14T08:00:03.000Z' }))
      const all = await store.listSuggestions({ limit: 10, offset: 0 })
      expect(all.total).toBe(3); expect(all.counts).toMatchObject({ all: 3, draft: 1, approved: 2 }); expect(all.items.map((r) => r.name)).toEqual(['پاریس', 'ب', 'الف']) // جدیدترین اول
      const st = await store.listSuggestions({ status: 'approved', limit: 10, offset: 0 }); expect(st.total).toBe(2); expect(st.counts.all).toBe(3)
      const sc = await store.listSuggestions({ scope: 'international', limit: 10, offset: 0 }); expect(sc.items.map((r) => r.name)).toEqual(['پاریس']); expect(sc.counts.all).toBe(1)
      expect((await store.listSuggestions({ q: 'ایل', limit: 10, offset: 0 })).items.map((r) => r.name)).toEqual(['پاریس'])
      expect((await store.listSuggestions({ q: '%', limit: 10, offset: 0 })).total).toBe(0) // نویسهٔ ویژه جست‌وجوی لفظی است
      const page = await store.listSuggestions({ sort: 'created', order: 'asc', limit: 1, offset: 1 }); expect(page.items).toHaveLength(1); expect(page.total).toBe(3)
    })

    it('قالب پرامپت: نسخهٔ پیاپی، فعال‌سازی یکتا و بازنشانی', async () => {
      store = await mk()
      const p1 = await store.addPrompt({ text: 'a'.repeat(40), note: '1', created_at: '2026-10-14T08:00:00.000Z' })
      const p2 = await store.addPrompt({ text: 'b'.repeat(40), note: '2', created_at: '2026-10-14T08:00:01.000Z' })
      expect([p1.version, p2.version]).toEqual([1, 2])
      await store.activatePrompt(p1.id); await store.activatePrompt(p2.id)
      expect((await store.listPrompts()).filter((p) => p.active).map((p) => p.version)).toEqual([2])
      expect(await store.activatePrompt(12345)).toBeNull(); expect((await store.listPrompts()).filter((p) => p.active)).toHaveLength(1) // نامعتبر چیزی را عوض نمی‌کند
      await store.activatePrompt(-1); expect((await store.listPrompts()).filter((p) => p.active)).toHaveLength(0)
    })

    it('KV، رویدادها (حذف تکراری) و رضایت‌ها (آخرین وضعیت هر نوع)', async () => {
      store = await mk()
      expect(await store.getKV('k')).toBeNull(); await store.setKV('k', '1'); await store.setKV('k', '2'); expect(await store.getKV('k')).toBe('2'); await store.deleteKV('k'); expect(await store.getKV('k')).toBeNull()
      const ev = { event_id: 'e1', anonymous_id: 'a', event_type: 'app_open', occurred_at: '2026-10-14T08:00:00.000Z', session_id: 's', props: { q: 1 }, app_version: '1', platform: 'web', consent_context: { analytics: true }, received_at: '2026-10-14T08:00:01.000Z' }
      expect(await store.addEvents([ev, { ...ev, event_id: 'e2' }])).toEqual({ inserted: 2, duplicates: 0 })
      expect(await store.addEvents([ev])).toEqual({ inserted: 0, duplicates: 1 })
      const c = (id: string, granted: boolean, at: string) => ({ consent_id: id, subject_id: 'a', kind: 'analytics', granted, recorded_at: at, policy_version: 'v', source: 'settings', received_at: at })
      expect(await store.addConsents([c('c1', true, '2026-10-14T08:00:00.000Z'), c('c2', false, '2026-10-14T09:00:00.000Z')])).toBe(2)
      expect(await store.addConsents([c('c1', true, '2026-10-14T08:00:00.000Z')])).toBe(0)
      expect(await store.latestConsents('a')).toEqual({ analytics: false }); expect(await store.latestConsents('zzz')).toEqual({})
      expect(await store.eventStats()).toEqual({ events: 2, consents: 2 })
    })
  })
}

describe('راه‌اندازی دوباره روی همان پایگاه‌داده (ماندگاری + مهاجرت تکرارپذیر)', () => {
  it('داده بعد از ساخت دوبارهٔ Store می‌ماند و کلید رمزنگاری‌شده از رابط مدیر خوانده می‌شود', async () => {
    const db = new PGlite(); const q = async (t: string, p?: unknown[]) => (await db.query(t, p as never[])).rows as Record<string, unknown>[]
    const cfg = loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/nonexistent', SECRETS_ENCRYPTION_KEY: 'x'.repeat(24) })
    let app = await buildApp({ config: cfg, store: await createPgStore(q, SQL) })
    const put = await app.inject({ method: 'PUT', url: '/api/admin/settings/secrets/gemini', payload: { value: 'AIza-REAL-KEY-9876' } })
    expect(put.statusCode).toBe(200); expect(put.json().status.masked).toBe('••••9876')
    const created = await app.inject({ method: 'POST', url: '/api/admin/suggestions', payload: { content: content('سنندج') } }); expect(created.statusCode).toBe(201)
    await app.close()
    app = await buildApp({ config: cfg, store: await createPgStore(q, SQL) }) // «ری‌استارت»: مهاجرت دوباره اجرا می‌شود
    const st = (await app.inject('/api/admin/settings/secrets')).json()
    expect(st.secrets.gemini).toMatchObject({ configured: true, source: 'ui', masked: '••••9876' }); expect(st.setup).toMatchObject({ storage: 'postgres', encryption_key: true })
    expect(JSON.stringify(st)).not.toContain('AIza-REAL-KEY')
    expect(((await app.inject('/api/admin/suggestions')).json() as { items: unknown[] }).items).toHaveLength(1)
    await app.close()
  })
})
