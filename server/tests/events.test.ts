import { afterEach, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'

let app: FastifyInstance
afterEach(async () => { await app?.close() })
const ctx = { analytics: true, marketing: true, notifications: false, location: false }
const ev = (id: string, over: Record<string, unknown> = {}) => ({ event_id: id, anonymous_id: 'anon_1', event_type: 'view_destination', occurred_at: '2026-10-12T05:00:00Z', session_id: 's1', destination_id: 3, app_version: '1.0.0', platform: 'pwa', consent_context: ctx, ...over })
const cons = (id: string, kind: string, granted: boolean, at: string) => ({ consent_id: id, subject_id: 'anon_1', kind, granted, recorded_at: at, policy_version: '2026-10-v3', source: 'default' })
const send = async (body: unknown) => (await app.inject({ method: 'POST', url: '/api/events', payload: body as object })).json()
const mk = async () => { app = await buildApp({ config: loadConfig({ NODE_ENV: 'test', STATIC_DIR: '/x' }) }) }
const base = { anonymous_id: 'anon_1', platform: 'pwa', app_version: '1.0.0' }

it('رویدادها ذخیره می‌شوند و ارسال دوباره (تکراری) دوبار ثبت نمی‌شود', async () => {
  await mk()
  const body = { ...base, consents: [cons('c1', 'analytics', true, '2026-10-12T04:00:00Z'), cons('c2', 'marketing', true, '2026-10-12T04:00:00Z')], events: [ev('e1'), ev('e2')] }
  expect(await send(body)).toMatchObject({ accepted: 2, duplicates: 0, consents_saved: 2, rejected: 0 })
  expect(await send(body)).toMatchObject({ accepted: 0, duplicates: 2, consents_saved: 0 })
})
it('لغو رضایت تحلیل: رویدادهای بعدی (حتی با context قدیمی) ذخیره نمی‌شوند', async () => {
  await mk()
  await send({ ...base, consents: [cons('c1', 'analytics', true, '2026-10-12T04:00:00Z')], events: [ev('e1')] })
  const r = await send({ ...base, consents: [cons('c3', 'analytics', false, '2026-10-12T06:00:00Z')], events: [ev('e2')] })
  expect(r).toMatchObject({ accepted: 0, dropped_no_consent: 1, consents_saved: 1 })
  expect(await send({ ...base, events: [ev('e3', { consent_context: { ...ctx, analytics: false } })] })).toMatchObject({ accepted: 0, dropped_no_consent: 1 })
})
it('ورودی نامعتبر یا مربوط به نصب دیگر رد می‌شود؛ فیلد ناشناخته (متن آزاد) ذخیره نمی‌شود', async () => {
  await mk()
  const r = await send({ ...base, events: [ev('e1', { event_type: 'hack' }), ev('e2', { anonymous_id: 'anon_2' }), ev('e3', { query_text: 'متن کاربر', destination_id: 5 })] })
  expect(r).toMatchObject({ accepted: 1, rejected: 2 })
  expect((await app.inject({ method: 'POST', url: '/api/events', payload: { events: 'x' } })).statusCode).toBe(400)
  expect((await app.inject({ method: 'POST', url: '/api/events', payload: { ...base, events: Array.from({ length: 101 }, (_, i) => ev('x' + i)) } })).statusCode).toBe(400)
})
