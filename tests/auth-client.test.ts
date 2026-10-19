import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { deleteAccount, getAuth, logout, refreshAuth, requestCode, verifyCode } from '../src/auth/client'
import { normalizeIranMobile } from '../src/auth/phone'

interface Call { url: string; method: string; body: Record<string, unknown> | null; credentials: string | undefined }
const reply = (status: number, json?: unknown, type = 'application/json') => ({ status, json, type })
function mock(...replies: (ReturnType<typeof reply> | 'throw')[]) {
  const calls: Call[] = []
  let i = 0
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : null, credentials: init?.credentials })
    const r = replies[Math.min(i++, replies.length - 1)]
    if (r === 'throw') throw new Error('offline')
    return new Response(r.status === 204 ? null : JSON.stringify(r.json ?? {}), { status: r.status, headers: { 'content-type': r.type } })
  }) as typeof fetch
  return { f, calls }
}

describe('شماره موبایل (کلاینت)', () => {
  test('قالب‌های رایج نرمال می‌شوند و نامعتبرها رد می‌شوند', () => {
    for (const v of ['09121234567', '9121234567', '+989121234567', '00989121234567', '989121234567', '۰۹۱۲۱۲۳۴۵۶۷', '0912 123 4567', '0912-123-4567', '٠٩١٢١٢٣٤٥٦٧']) assert.equal(normalizeIranMobile(v), '09121234567', v)
    for (const v of ['', '0912', '09121234', '021123456789', '+15551234567', 'abc', '091212345678', '0912123456a']) assert.equal(normalizeIranMobile(v), null, v)
  })
})

describe('کلاینت ورود', () => {
  test('requestCode: موفق، خطاهای سرور و قطع شبکه', async () => {
    const ok = mock(reply(200, { ok: true, expires_in: 120, resend_in: 60, dev_code: '123456' }))
    assert.deepEqual(await requestCode('09121234567', ok.f), { ok: true, resendIn: 60, expiresIn: 120, devCode: '123456' })
    assert.equal(ok.calls[0].url, '/api/auth/otp/request'); assert.equal(ok.calls[0].method, 'POST'); assert.deepEqual(ok.calls[0].body, { phone: '09121234567' }); assert.equal(ok.calls[0].credentials, 'same-origin')
    const cases: [ReturnType<typeof reply> | 'throw', object][] = [
      [reply(429, { error: 'too_soon', retry_after: 42 }), { ok: false, error: 'too_soon', retryAfter: 42 }],
      [reply(429, { error: 'too_many', retry_after: 3000 }), { ok: false, error: 'too_many', retryAfter: 3000 }],
      [reply(400, { error: 'invalid_phone' }), { ok: false, error: 'invalid_phone' }],
      [reply(503, { error: 'sms_unavailable' }), { ok: false, error: 'sms_unavailable' }],
      [reply(502, { error: 'sms_failed' }), { ok: false, error: 'sms_failed' }],
      [reply(403, { error: 'forbidden_origin' }), { ok: false, error: 'forbidden' }],
      [reply(200, '<html>', 'text/html'), { ok: false, error: 'network' }], // سرور API نیست (فقط فایل‌های ثابت)
      ['throw', { ok: false, error: 'network' }],
    ]
    for (const [r, want] of cases) assert.deepEqual(await requestCode('09121234567', mock(r).f), want)
  })

  test('verifyCode: موفق وضعیت را «واردشده» می‌کند؛ anonymous_id فقط در صورت ارسال', async () => {
    const user = { id: 'u1', phone_masked: '0912***4567', created_at: '2026-10-17T00:00:00Z' }
    const a = mock(reply(200, { user, created: true }))
    assert.deepEqual(await verifyCode('09121234567', '123456', undefined, a.f), { ok: true, user, created: true })
    assert.deepEqual(a.calls[0].body, { phone: '09121234567', code: '123456' })
    assert.equal(getAuth().status, 'in'); assert.deepEqual(getAuth().user, user)
    const b = mock(reply(200, { user, created: false }))
    await verifyCode('09121234567', '123456', 'anon_1', b.f)
    assert.deepEqual(b.calls[0].body, { phone: '09121234567', code: '123456', anonymous_id: 'anon_1' })
  })

  test('verifyCode: کد نادرست، منقضی، قفل و شبکه (وضعیت واردشده تغییر نمی‌کند)', async () => {
    await logout(mock(reply(204)).f)
    const cases: [ReturnType<typeof reply> | 'throw', object][] = [
      [reply(401, { error: 'wrong_code', attempts_left: 3 }), { ok: false, error: 'wrong_code', attemptsLeft: 3 }],
      [reply(410, { error: 'expired' }), { ok: false, error: 'expired' }],
      [reply(429, { error: 'locked' }), { ok: false, error: 'locked' }],
      [reply(400, { error: 'invalid' }), { ok: false, error: 'invalid' }],
      ['throw', { ok: false, error: 'network' }],
    ]
    for (const [r, want] of cases) assert.deepEqual(await verifyCode('09121234567', '000000', undefined, mock(r).f), want)
    assert.equal(getAuth().status, 'out')
  })

  test('refreshAuth: واردشده، خارج‌شده، و حفظ وضعیت هنگام قطع شبکه', async () => {
    const user = { id: 'u1', phone_masked: '0912***4567', created_at: 'x' }
    const seq = (cfg: unknown, me: unknown) => { const calls: string[] = []; const f = (async (url: string) => { calls.push(String(url)); return new Response(JSON.stringify(String(url).endsWith('config') ? cfg : me), { status: 200, headers: { 'content-type': 'application/json' } }) }) as typeof fetch; return { f, calls } }
    const a = seq({ sms: true }, { user }); await refreshAuth(a.f)
    assert.deepEqual(a.calls.sort(), ['/api/auth/config', '/api/auth/me']); assert.equal(getAuth().status, 'in'); assert.equal(getAuth().available, true)
    await refreshAuth(mock('throw').f) // قطع شبکه: وضعیت قبلی باقی می‌ماند
    assert.equal(getAuth().status, 'in'); assert.equal(getAuth().available, true)
    await refreshAuth(seq({ sms: false }, { user: null }).f)
    assert.equal(getAuth().status, 'out'); assert.equal(getAuth().user, null); assert.equal(getAuth().available, false)
  })

  test('logout و deleteAccount', async () => {
    const user = { id: 'u1', phone_masked: '0912***4567', created_at: 'x' }
    await verifyCode('09121234567', '123456', undefined, mock(reply(200, { user, created: false })).f)
    assert.equal(getAuth().status, 'in')
    const out = mock(reply(204)); assert.equal(await logout(out.f), true)
    assert.equal(out.calls[0].url, '/api/auth/logout'); assert.equal(out.calls[0].method, 'POST'); assert.equal(getAuth().status, 'out')
    await verifyCode('09121234567', '123456', undefined, mock(reply(200, { user, created: false })).f)
    const del = mock(reply(204)); assert.equal(await deleteAccount(del.f), true)
    assert.equal(del.calls[0].method, 'DELETE'); assert.equal(del.calls[0].url, '/api/auth/account'); assert.equal(getAuth().status, 'out')
    assert.equal(await deleteAccount(mock('throw').f), false) // خطای شبکه: موفقیت ادعا نمی‌شود
  })
})
