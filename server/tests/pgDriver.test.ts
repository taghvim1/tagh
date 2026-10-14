import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import postgres from 'postgres'
import { expect, it } from 'vitest'
import { createPgStore } from '../src/store/pgStore.js'

// همان مسیر تولید (postgres.js روی پروتکل واقعی PostgreSQL، با PGlite پشت یک سوکت) تا تفاوت نوع پارامترها/تاریخ‌ها در درایور واقعی هم دیده شود
it('createPgStore با درایور postgres.js (مثل src/index.ts) کار می‌کند', async () => {
  const db = await PGlite.create(); const server = new PGLiteSocketServer({ db, port: 54329, host: '127.0.0.1' }); await server.start()
  const sql = postgres('postgres://postgres:postgres@127.0.0.1:54329/postgres', { max: 1, onnotice: () => undefined, connection: { options: '' } })
  try {
    const store = await createPgStore(async (t, p) => [...(await sql.unsafe(t, (p ?? []) as never[]))] as Record<string, unknown>[], readFileSync(new URL('../migrations/001_init.sql', import.meta.url), 'utf8'))
    const season = { rating: 'good', average_temperature: 20, temperature_min: 10, temperature_max: 30, weather_condition: 'م', rainfall: 'low', humidity: 'low', priority: 0, description: 'خ' }
    const content = { name: 'سنندج', country: 'ایران', province_or_city: 'کردستان', scope: 'domestic', type: ['طبیعت'], description: 'شهری', duration: '۲', budget: 'متوسط', companions: [], recommended_for: [], attractions: [], visa_required: null, quality: 7, latitude: 1, longitude: 2, seasons: { spring: season, summer: season, autumn: season, winter: season } }
    const a = await store.insertSuggestion({ status: 'draft', source: 'manual', name: 'سنندج', country: 'ایران', content: content as never, version: 1, cover_image_id: null, reject_reason: null, ai_meta: null, created_at: '2026-10-14T08:00:00.000Z', updated_at: '2026-10-14T08:00:00.000Z', published_at: null })
    expect(typeof a.id).toBe('number'); expect(a.created_at).toBe('2026-10-14T08:00:00.000Z'); expect(a.content.name).toBe('سنندج')
    const u = await store.updateSuggestion(a.id, { status: 'approved', ai_meta: { sources: [] }, published_at: '2026-10-14T09:00:00.000Z' }); expect(u!.published_at).toBe('2026-10-14T09:00:00.000Z')
    const l = await store.listSuggestions({ q: 'سنند', limit: 5, offset: 0 }); expect(l.total).toBe(1); expect(l.counts).toMatchObject({ all: 1, approved: 1 })
    await store.setKV('a', 'b'); expect(await store.getKV('a')).toBe('b')
    expect(await store.addEvents([{ event_id: 'e', anonymous_id: 'a', event_type: 't', occurred_at: '2026-10-14T08:00:00.000Z', session_id: 's', props: { x: 1 }, app_version: '1', platform: 'web', consent_context: { analytics: true }, received_at: '2026-10-14T08:00:00.000Z' }])).toEqual({ inserted: 1, duplicates: 0 })
    expect(await store.addConsents([{ consent_id: 'c', subject_id: 'a', kind: 'analytics', granted: true, recorded_at: '2026-10-14T08:00:00.000Z', policy_version: 'v', source: 's', received_at: '2026-10-14T08:00:00.000Z' }])).toBe(1)
    expect(await store.latestConsents('a')).toEqual({ analytics: true })
    const p = await store.addPrompt({ text: 'x'.repeat(40), note: '', created_at: '2026-10-14T08:00:00.000Z' }); await store.activatePrompt(p.id); expect((await store.listPrompts())[0].active).toBe(true)
  } finally { await sql.end({ timeout: 1 }); await server.stop(); await db.close() }
}, 60_000)
