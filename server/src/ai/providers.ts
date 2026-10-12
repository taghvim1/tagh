// ارائه‌دهندگان خارجی. fetch تزریق‌پذیر است تا بدون شبکه تست شوند. هیچ خطایی کلید را در پیامش نمی‌آورد.
export type Fetch = typeof fetch
export class ProviderError extends Error { constructor(public code: 'invalid_key' | 'quota' | 'unavailable' | 'bad_response' | 'not_configured', message: string) { super(message) } }
const UA = 'TaghvimSafar/1.0 (admin research tool)'
const TIMEOUT = 45_000

async function call(f: Fetch, url: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<unknown> {
  let res: Response
  try { res = await f(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) }) } catch { throw new ProviderError('unavailable', 'اتصال به سرویس برقرار نشد یا زمان انتظار تمام شد.') }
  if (res.status === 401 || res.status === 403 || res.status === 400 && url.includes('generativelanguage')) {
    // در Gemini کلید نامعتبر ۴۰۰ هم می‌دهد؛ برای تمایز، متن خطا بررسی می‌شود
    const body = await res.text().catch(() => '')
    if (res.status !== 400 || /API key|API_KEY/i.test(body)) throw new ProviderError('invalid_key', 'کلید API نامعتبر است یا دسترسی ندارد.')
    throw new ProviderError('bad_response', 'درخواست توسط سرویس پذیرفته نشد (مدل یا پارامتر نامعتبر).')
  }
  if (res.status === 429) throw new ProviderError('quota', 'سهمیه یا نرخ مجاز سرویس تمام شده است.')
  if (!res.ok) throw new ProviderError('unavailable', `سرویس خطا داد (${res.status}).`)
  try { return await res.json() } catch { throw new ProviderError('bad_response', 'پاسخ سرویس JSON معتبر نبود.') }
}

// ---- Gemini ----
export async function geminiGenerate(f: Fetch, key: string, model: string, prompt: string, opts: { temperature?: number; maxOutputTokens?: number; json?: boolean } = {}): Promise<string> {
  if (!/^[\w.\-]+$/.test(model)) throw new ProviderError('bad_response', 'نام مدل نامعتبر است.')
  const data = (await call(f, `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: opts.temperature ?? 0.3, ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}), ...(opts.json ? { responseMimeType: 'application/json' } : {}) } }),
  })) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new ProviderError('bad_response', 'مدل پاسخ متنی برنگرداند (ممکن است محتوا مسدود شده باشد).')
  return text
}

// ---- Brave Search (وب) ----
export interface WebResult { title: string; url: string; snippet: string }
export async function braveSearch(f: Fetch, key: string, q: string, count: number): Promise<WebResult[]> {
  const u = new URL('https://api.search.brave.com/res/v1/web/search'); u.searchParams.set('q', q); u.searchParams.set('count', String(count))
  const data = (await call(f, u.toString(), { headers: { accept: 'application/json', 'x-subscription-token': key } })) as { web?: { results?: { title?: string; url?: string; description?: string }[] } }
  return (data.web?.results ?? []).filter((r) => r.url && /^https?:\/\//.test(r.url)).slice(0, count).map((r) => ({ title: stripHtml(r.title ?? r.url!), url: r.url!, snippet: stripHtml(r.description ?? '').slice(0, 300) }))
}

// ---- تصاویر ----
export interface ImageCandidate { url: string; thumb_url: string | null; provider: 'wikimedia' | 'pexels'; source_url: string | null; author: string | null; license: string | null; license_url: string | null; attribution: string | null }
export const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
const httpsOnly = (u?: string | null) => (u && /^https:\/\//.test(u) ? u : null)

export async function wikimediaImages(f: Fetch, q: string, limit: number): Promise<ImageCandidate[]> {
  const u = new URL('https://commons.wikimedia.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: String(limit * 2), prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '800', format: 'json', formatversion: '2' })) u.searchParams.set(k, v)
  const data = (await call(f, u.toString(), { headers: { 'user-agent': UA } })) as { query?: { pages?: { title: string; imageinfo?: { url: string; thumburl?: string; descriptionurl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }[] }[] } }
  const out: ImageCandidate[] = []
  for (const p of data.query?.pages ?? []) {
    const ii = p.imageinfo?.[0]; if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime ?? '')) continue
    const m = ii.extmetadata ?? {}, license = m.LicenseShortName?.value ? stripHtml(m.LicenseShortName.value) : null
    if (!license) continue // بدون مجوز مشخص پیشنهاد نمی‌شود
    const author = m.Artist?.value ? stripHtml(m.Artist.value).slice(0, 120) : null
    const url = httpsOnly(ii.thumburl ?? ii.url), full = httpsOnly(ii.url); if (!url || !full) continue
    out.push({ url, thumb_url: url, provider: 'wikimedia', source_url: httpsOnly(ii.descriptionurl), author, license, license_url: httpsOnly(m.LicenseUrl?.value ?? null),
      attribution: `${author ?? 'نویسندهٔ نامشخص'} — ${license} — Wikimedia Commons` })
    if (out.length >= limit) break
  }
  return out
}

export async function pexelsImages(f: Fetch, key: string, q: string, limit: number): Promise<ImageCandidate[]> {
  const u = new URL('https://api.pexels.com/v1/search'); u.searchParams.set('query', q); u.searchParams.set('per_page', String(limit))
  const data = (await call(f, u.toString(), { headers: { authorization: key } })) as { photos?: { url?: string; photographer?: string; src?: { large?: string; medium?: string } }[] }
  return (data.photos ?? []).flatMap((p): ImageCandidate[] => {
    const url = httpsOnly(p.src?.large); if (!url) return []
    return [{ url, thumb_url: httpsOnly(p.src?.medium), provider: 'pexels', source_url: httpsOnly(p.url), author: p.photographer ?? null, license: 'Pexels License', license_url: 'https://www.pexels.com/license/', attribution: `${p.photographer ?? 'Pexels'} — Pexels` }]
  })
}
