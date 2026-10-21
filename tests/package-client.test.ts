import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { requestPackage } from '../src/package/client'
import { isPackageSaved, removePackage, savePackage } from '../src/package/saved'
import type { TourPackage } from '../src/package/types'

const input = { origin: 'تهران', destination: 'شیراز', budget: 'متوسط', vehicle: 'هواپیما', trip_type: 'خانوادگی', days: 3 }
const mk = (status: number, body: unknown, type = 'application/json') => (async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': type } })) as unknown as typeof fetch
const pkg: TourPackage = { id: 'p1', input, content: { title: 't', summary: 's', transport: 'x', days: [{ day: 1, title: 'a', plan: ['b'] }], cost: { total: '1', breakdown: [] }, tips: ['c'], warnings: [], image_query: 'q' }, image: null, sources: [], generated_at: 'x' }

describe('پکیج تور (کلاینت)', () => {
  test('requestPackage: موفق و خطاها', async () => {
    assert.deepEqual(await requestPackage(input, mk(200, { package: pkg })), { ok: true, package: pkg })
    assert.equal((await requestPackage(input, mk(400, { error: 'invalid' }))).ok, false)
    const busy = await requestPackage(input, mk(429, {})); assert.equal(!busy.ok && busy.error, 'busy')
    const un = await requestPackage(input, mk(503, { message: 'در دسترس نیست' })); assert.deepEqual(un, { ok: false, error: 'unavailable', message: 'در دسترس نیست' })
    const nw = await requestPackage(input, mk(200, 'x', 'text/html')); assert.equal(!nw.ok && nw.error, 'network')
    const th = await requestPackage(input, (async () => { throw new Error('off') }) as unknown as typeof fetch); assert.equal(!th.ok && th.error, 'network')
  })
  test('ذخیره/حذف پکیج (بدون ذخیره‌سازی هم در حافظه کار می‌کند و تکراری نمی‌شود)', () => {
    savePackage(pkg); savePackage(pkg); assert.equal(isPackageSaved('p1'), true)
    removePackage('p1'); assert.equal(isPackageSaved('p1'), false)
  })
})
