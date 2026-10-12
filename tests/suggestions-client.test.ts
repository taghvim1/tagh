import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MOCK_DESTINATIONS } from '../src/data/destinations'
import { ApiError, api, diffContent, friendly } from '../src/admin/suggestions/api'
import { contentToDestination, destinationToContent } from '../src/travel/suggestionContent'
import { refreshRemoteSuggestions, toRemoteDestinations } from '../src/travel/remote'

test('تبدیل مقصد ↔ محتوای پیشنهاد رفت‌وبرگشتی و مشتقات دوباره محاسبه می‌شود', () => {
  for (const d of MOCK_DESTINATIONS) {
    const c = destinationToContent(d), back = contentToDestination(c, d.id, d.image)
    assert.deepEqual({ ...back, image_credit: undefined }, { ...d, image_credit: undefined }, d.name)
  }
})

test('diffContent فقط فیلدهای تغییرکرده را (با مسیر تو در تو) برمی‌گرداند', () => {
  const a = destinationToContent(MOCK_DESTINATIONS[0]), b = structuredClone(a)
  assert.deepEqual(diffContent(a, b), [])
  b.description = 'متن تازه'; b.seasons.winter.rating = 'good'; b.attractions.push('جای جدید')
  assert.deepEqual(diffContent(a, b).map((l) => l.path).sort(), ['attractions', 'description', 'seasons.winter.rating'])
})

test('api: خطای شبکه، پاسخ غیر JSON و خطای اعتبارسنجی پیام فارسی دقیق می‌دهند', async () => {
  const mkRes = (body: string, status: number, ct = 'application/json') => async () => new Response(body, { status, headers: { 'content-type': ct } })
  await assert.rejects(api('/x', {}, async () => { throw new Error('down') }), (e: ApiError) => e.status === 0)
  await assert.rejects(api('/x', {}, mkRes('<html>', 200, 'text/html')), (e: ApiError) => e.status === 0 && /JSON/.test(e.message))
  await assert.rejects(api('/x', {}, mkRes(JSON.stringify({ error: 'validation', errors: ['الف', 'ب'] }), 400)), (e: ApiError) => friendly(e) === 'الف | ب')
  assert.match(friendly(new ApiError(503, 'admin_disabled')), /ADMIN_TOKEN/)
  assert.match(friendly(new ApiError(409, 'version_conflict')), /تازه/)
})

test('برنامهٔ کاربر: پاسخ غیر JSON (هاست فقط‌ایستا) یا خطا، فهرست را تغییر نمی‌دهد؛ پاسخ معتبر به شناسهٔ ≥۱۰۰۰ تبدیل می‌شود', async () => {
  assert.equal(await refreshRemoteSuggestions(async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })), false)
  assert.equal(await refreshRemoteSuggestions(async () => { throw new Error('offline') }), false)
  const c = destinationToContent(MOCK_DESTINATIONS[0])
  const list = toRemoteDestinations([{ id: 7, version: 1, content: c, image: { url: 'https://x/y.jpg', attribution: 'Ali — CC BY', license: 'CC BY 4.0' } }])
  assert.equal(list[0].id, 1007); assert.equal(list[0].image, 'https://x/y.jpg'); assert.match(list[0].image_credit ?? '', /Ali/)
})
