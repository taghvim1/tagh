import { BackendNotConnectedError, type Transport } from './tracker'

/** ارسال دسته‌ای به /api/events. اگر سرور نباشد (مثلاً هاست فقط‌ایستا که HTML برمی‌گرداند) یا خطا بدهد، رویدادها در صف می‌مانند. */
export function createHttpTransport(fetchImpl: typeof fetch = (...a) => fetch(...a), url = '/api/events'): Transport {
  return {
    async send(events, ctx) {
      let res: Response
      try {
        res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...ctx, events }), signal: AbortSignal.timeout(15_000), keepalive: JSON.stringify(events).length < 60_000 })
      } catch { throw new Error('NETWORK_ERROR') }
      if (!(res.headers.get('content-type') ?? '').includes('json') || res.status === 404) throw new BackendNotConnectedError()
      if (!res.ok) throw new Error(`HTTP_${res.status}`)
    },
  }
}
