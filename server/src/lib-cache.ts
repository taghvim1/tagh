import { createHash } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

/** کش کوتاه‌مدت در حافظه با ادغام درخواست‌های هم‌زمان: ۱۰۰۰ کاربر هم‌زمان = یک بار محاسبه. */
export function createMicroCache(now: () => number = () => Date.now()) {
  const m = new Map<string, { at: number; v: Promise<unknown> }>()
  return function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const e = m.get(key)
    if (e && now() - e.at < ttlMs) return e.v as Promise<T>
    const v = fn()
    m.set(key, { at: now(), v })
    v.catch(() => { if (m.get(key)?.v === v) m.delete(key) }) // خطا کش نمی‌شود
    return v
  }
}

/** پاسخ عمومی قابل‌کش: ETag + max-age؛ اگر مرورگر همان نسخه را دارد ۳۰۴ (بدنه نمی‌رود). */
export function sendCacheable(req: FastifyRequest, reply: FastifyReply, payload: unknown, maxAgeS: number) {
  const body = JSON.stringify(payload)
  const etag = `W/"${createHash('sha1').update(body).digest('base64url').slice(0, 20)}"`
  reply.header('Cache-Control', `public, max-age=${maxAgeS}, stale-while-revalidate=${maxAgeS * 6}`).header('ETag', etag)
  if (req.headers['if-none-match'] === etag) return reply.code(304).send()
  return reply.type('application/json; charset=utf-8').send(body)
}
