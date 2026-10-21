import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { fetchJob, startPackage } from '../src/package/client'
import { isPackageSaved, removePackage, savePackage } from '../src/package/saved'
import { imagesOf, type TourPackage } from '../src/package/types'

const input = { origin: 'تهران', destination: 'شیراز', budget: 'متوسط', vehicle: 'هواپیما', trip_type: 'تاریخی', days: 3 }
const mk = (status: number, body: unknown, type = 'application/json') => (async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': type } })) as unknown as typeof fetch
const pkg: TourPackage = { id: 'p1', input, content: { title: 't', summary: 's', transport: 'x', days: [{ day: 1, title: 'a', plan: ['b'] }], cost: { items: [{ label: 'a', min: 1, max: 2 }], total_min: 1, total_max: 2 }, tips: ['c'], warnings: [], image_query: 'q' }, images: [], generated_at: 'x' }

describe('پکیج تور (کلاینت)', () => {
  test('startPackage: شناسهٔ کار، و خطاها', async () => {
    assert.deepEqual(await startPackage(input, null, mk(202, { job_id: 'j1' })), { ok: true, jobId: 'j1' })
    assert.equal((await startPackage(input, null, mk(400, { error: 'invalid' }))).ok, false)
    const busy = await startPackage(input, null, mk(429, {})); assert.equal(!busy.ok && busy.error, 'busy')
    assert.deepEqual(await startPackage(input, null, mk(503, { message: 'در دسترس نیست' })), { ok: false, error: 'unavailable', message: 'در دسترس نیست' })
    const nw = await startPackage(input, null, mk(200, 'x', 'text/html')); assert.equal(!nw.ok && nw.error, 'network')
    assert.equal((await startPackage(input, null, (async () => { throw new Error('off') }) as unknown as typeof fetch)).ok, false)
  })
  test('اشتراک Push فقط وقتی هست در بدنه می‌رود', async () => {
    let body = ''
    const f = (async (_u: string, init?: RequestInit) => { body = String(init?.body); return new Response(JSON.stringify({ job_id: 'j' }), { status: 202, headers: { 'content-type': 'application/json' } }) }) as unknown as typeof fetch
    await startPackage(input, { endpoint: 'https://p/x', keys: { p256dh: 'a', auth: 'b' } }, f); assert.ok(JSON.parse(body).push.endpoint)
    await startPackage(input, null, f); assert.equal('push' in JSON.parse(body), false)
  })
  test('fetchJob: pending / done / failed / gone / offline', async () => {
    assert.deepEqual(await fetchJob('j', mk(200, { job: { status: 'pending' } })), { status: 'pending' })
    assert.deepEqual(await fetchJob('j', mk(200, { job: { status: 'done', package: pkg } })), { status: 'done', package: pkg })
    assert.deepEqual(await fetchJob('j', mk(200, { job: { status: 'failed', error: 'quota' } })), { status: 'failed', error: 'quota' })
    assert.deepEqual(await fetchJob('j', mk(404, { error: 'not_found' })), { status: 'gone' })
    assert.deepEqual(await fetchJob('j', (async () => { throw new Error('off') }) as unknown as typeof fetch), { status: 'offline' })
    assert.deepEqual(await fetchJob('j', mk(500, 'x', 'text/html')), { status: 'offline' })
  })
  test('ذخیره/حذف پکیج؛ سازگاری با پکیج قدیمی تک‌تصویری', () => {
    savePackage(pkg); savePackage(pkg); assert.equal(isPackageSaved('p1'), true)
    removePackage('p1'); assert.equal(isPackageSaved('p1'), false)
    const img = { url: 'https://a/b.jpg', attribution: null, source_url: null, license: 'CC' }
    assert.deepEqual(imagesOf({ ...pkg, images: undefined, image: img }), [img]); assert.deepEqual(imagesOf({ ...pkg, images: [img, img] }), [img, img]); assert.deepEqual(imagesOf(pkg), [])
  })
})
