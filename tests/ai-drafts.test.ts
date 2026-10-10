import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MOCK_DESTINATIONS } from '../src/data/destinations'
import { AiUnavailableError, createRemoteAiGenerator } from '../src/admin/ai/generator'
import { buildPrompt, checkApproval, parseAiDestinations } from '../src/admin/ai/drafts'

const season = (rating = 'good') => ({ rating, average_temperature: 20, temperature_min: 10, temperature_max: 30, weather_condition: 'معتدل', rainfall: 'low', humidity: 'low', description: 'خوب' })
const item = (over: Record<string, unknown> = {}) => ({
  name: 'سنندج', country: 'ایران', province_or_city: 'کردستان', scope: 'domestic', type: ['طبیعت', 'فرهنگی'], description: 'شهری در دل زاگرس', duration: '۲ تا ۳ روز', budget: 'متوسط',
  companions: ['خانواده'], recommended_for: ['عکاسان'], attractions: ['عمارت آصف'], visa_required: null, quality: 7, latitude: 35.31, longitude: 46.99, image_url: '', image_query: 'سنندج',
  seasons: { spring: season('excellent'), summer: season(), autumn: season(), winter: season('acceptable') }, ...over })

test('خروجی معتبر AI به مقصد تبدیل می‌شود و تصویر خالی در پیش‌نویس خالی می‌ماند', () => {
  const r = parseAiDestinations('```json\n' + JSON.stringify([item()]) + '\n```', 100)
  assert.deepEqual(r.errors, [])
  assert.equal(r.items.length, 1)
  const d = r.items[0].destination
  assert.equal(d.id, 100); assert.equal(d.image, ''); assert.deepEqual(d.best_seasons.includes('بهار'), true); assert.equal(d.latitude, 35.31)
  assert.equal(parseAiDestinations(JSON.stringify({ destinations: [item()] }), 1).items.length, 1)
})

test('خروجی نامعتبر با خطای فارسی رد می‌شود و مورد معیوب بقیه را خراب نمی‌کند', () => {
  assert.match(parseAiDestinations('نه json', 1).errors[0], /JSON/)
  const bad = item({ name: 'بد', type: ['فضایی'], budget: 'ارزان', scope: 'x' })
  const noSeason = item({ name: 'ناقص', seasons: { spring: season() } })
  const r = parseAiDestinations(JSON.stringify([item(), bad, noSeason]), 1)
  assert.equal(r.items.length, 1)
  assert.ok(r.errors.some((e) => e.includes('بد') && e.includes('فضایی')))
  assert.ok(r.errors.some((e) => e.includes('ناقص') && e.includes('تابستان')))
  assert.ok(parseAiDestinations(JSON.stringify([item({ seasons: { ...item().seasons, summer: { ...season(), rating: 'great' } } })]), 1).errors.length > 0)
})

test('آدرس تصویر فقط http/مسیر/data:image پذیرفته می‌شود (javascript: رد)', () => {
  assert.equal(parseAiDestinations(JSON.stringify([item({ image_url: 'https://x.test/a.jpg' })]), 1).items[0].destination.image, 'https://x.test/a.jpg')
  assert.equal(parseAiDestinations(JSON.stringify([item({ image_url: 'javascript:alert(1)' })]), 1).items[0].destination.image, '')
})

test('شرایط تأیید: بدون تصویر یا تکراری مسدود؛ بدون مختصات هشدار', () => {
  const d = parseAiDestinations(JSON.stringify([item({ latitude: undefined, longitude: undefined })]), 1).items[0].destination
  const c = checkApproval(d, MOCK_DESTINATIONS)
  assert.ok(c.blocking.some((m) => m.includes('تصویر'))); assert.ok(c.warnings.some((m) => m.includes('مختصات')))
  assert.equal(checkApproval({ ...d, image: '/a.jpg' }, MOCK_DESTINATIONS).blocking.length, 0)
  assert.ok(checkApproval({ ...d, image: '/a.jpg', name: MOCK_DESTINATIONS[0].name, country: MOCK_DESTINATIONS[0].country }, MOCK_DESTINATIONS).blocking.some((m) => m.includes('وجود دارد')))
})

test('پرومپت شامل مقصدها، فهرست مقادیر مجاز و هر چهار فصل است', () => {
  const p = buildPrompt(['سنندج', 'کیش'])
  for (const s of ['- سنندج', '- کیش', 'spring', 'summer', 'autumn', 'winter', 'image_query', 'latitude']) assert.ok(p.includes(s), s)
})

test('تولید/جست‌وجوی تصویر بدون سرور خطای شفاف می‌دهد (نتیجهٔ ساختگی نه)', async () => {
  const down = createRemoteAiGenerator('/api/admin/ai', (async () => { throw new TypeError('x') }) as typeof fetch)
  await assert.rejects(down.generate(['a']), AiUnavailableError)
  const html = createRemoteAiGenerator('/api/admin/ai', (async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as typeof fetch)
  await assert.rejects(html.searchImages('a'), (e: AiUnavailableError) => e.code === 'BACKEND_NOT_CONNECTED')
  const ok = createRemoteAiGenerator('/api/admin/ai', (async () => new Response('[{"url":"https://i.test/1.jpg"}]', { headers: { 'content-type': 'application/json' } })) as typeof fetch)
  assert.equal((await ok.searchImages('a'))[0].url, 'https://i.test/1.jpg')
})
