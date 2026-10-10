// اتصال به سرویس تولید/جست‌وجوی تصویر. کلید هوش مصنوعی هرگز در مرورگر نیست؛ فقط سرور (پس از احراز هویت مدیر) آن را دارد.
// این endpointها هنوز روی سرور ساخته نشده‌اند؛ تا آن زمان هر فراخوانی خطای «آماده نیست» می‌دهد (نه نتیجهٔ ساختگی).
export class AiUnavailableError extends Error { constructor(public code = 'BACKEND_NOT_CONNECTED') { super(code) } }
export interface ImageResult { url: string; thumb?: string; credit?: string; source?: string }
export interface AiGenerator {
  generate(names: string[]): Promise<string>
  searchImages(query: string): Promise<ImageResult[]>
}

export function createRemoteAiGenerator(base = '/api/admin/ai', fetchImpl: typeof fetch = (...a) => fetch(...a)): AiGenerator {
  async function req(path: string, init?: RequestInit): Promise<unknown> {
    let res: Response
    try { res = await fetchImpl(base + path, { credentials: 'include', headers: { 'content-type': 'application/json' }, ...init }) } catch { throw new AiUnavailableError('NETWORK_ERROR') }
    if (res.status === 401 || res.status === 403) throw new AiUnavailableError('UNAUTHORIZED')
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) throw new AiUnavailableError('BACKEND_NOT_CONNECTED')
    return res.json()
  }
  return {
    generate: async (names) => JSON.stringify(await req('/destinations', { method: 'POST', body: JSON.stringify({ names }) })),
    searchImages: async (q) => (await req(`/images?q=${encodeURIComponent(q)}`)) as ImageResult[],
  }
}
