import { contentSchema, dupKey, issuesOf, type SuggestionContent } from '../domain/schema.js'
import type { Secrets } from '../secrets.js'
import type { AiMeta, ImageRow, Store } from '../store/types.js'
import { renderPrompt, DEFAULT_TEMPLATE } from './prompt.js'
import { geminiGenerate, tavilySearch, unsplashImages, ProviderError, wikimediaImages, type Fetch, type ImageCandidate, type WebResult } from './providers.js'
import { loadAiSettings } from './settings.js'

export async function activeTemplate(store: Store): Promise<{ version: number; text: string }> {
  const a = (await store.listPrompts()).find((p) => p.active)
  return a ? { version: a.version, text: a.text } : { version: 0, text: DEFAULT_TEMPLATE } // نسخهٔ ۰ = پیش‌فرض داخلی
}

const IRAN = /^(ایران|جمهوری اسلامی ایران|iran|islamic republic of iran)$/i
/** داخلی/خارجی را از کشور تعیین می‌کند (نه از حدس مدل): ایران ⇒ داخلی و بدون ویزا، غیر آن ⇒ خارجی. */
export function normalizeScope(c: SuggestionContent): SuggestionContent {
  const domestic = IRAN.test(c.country.trim())
  return domestic ? { ...c, country: 'ایران', scope: 'domestic', visa_required: null } : { ...c, scope: 'international', visa_required: c.visa_required ?? false }
}

/** عبارت‌های جست‌وجوی تصویر با زاویه‌های متنوع (نه فقط طبیعت). */
export function imageQueriesFor(c: { name: string; country: string; image_query?: string; image_queries?: string[] }): string[] {
  const base = (c.image_query || `${c.name} ${c.country}`).trim()
  const extra = (c.image_queries ?? []).map((q) => q.trim()).filter(Boolean)
  const generic = extra.length >= 2 ? [] : [`${base} landmark`, `${base} architecture old town`, `${base} bazaar street food people`]
  return [...new Set([base, ...extra, ...generic])].slice(0, 5)
}

/** خروجی مدل (شیء/آرایهٔ JSON، با یا بدون ```) → محتوای معتبر */
export function parseModelOutput(text: string): { ok: true; value: SuggestionContent } | { ok: false; errors: string[] } {
  let data: unknown
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { return { ok: false, errors: ['خروجی مدل JSON معتبر نبود.'] } }
  if (Array.isArray(data)) data = data[0]
  const r = contentSchema.safeParse(data)
  return r.success ? { ok: true, value: normalizeScope(r.data) } : { ok: false, errors: issuesOf(r.error) }
}

export function createAiService(deps: { store: Store; secrets: Secrets; fetch: Fetch; now?: () => Date }) {
  const { store, secrets } = deps, f = deps.fetch, now = deps.now ?? (() => new Date())

  async function research(name: string): Promise<{ sources: WebResult[]; warning?: string }> {
    const s = await loadAiSettings(store)
    if (!s.webSearch.enabled || !s.tasks.generate.useWebSearch) return { sources: [] }
    const key = await secrets.get('tavily')
    if (!key) return { sources: [], warning: 'جست‌وجوی وب فعال است اما کلید آن تنظیم نشده؛ بدون منبع وب تولید شد.' }
    try { return { sources: await tavilySearch(f, key.value, `${name} راهنمای سفر بهترین فصل آب‌وهوا`, s.webSearch.maxResults) } }
    catch (e) { return { sources: [], warning: `جست‌وجوی وب ناموفق بود (${(e as Error).message}); بدون منبع وب تولید شد.` } }
  }

  /** مسیر اصلی → در خطای ارائه‌دهنده، مدل جایگزین. خطای کلید نامعتبر جایگزین ندارد. */
  async function llm(prompt: string): Promise<{ text: string; model: string; fallback: boolean }> {
    const s = await loadAiSettings(store), key = await secrets.get('gemini')
    if (!key) throw new ProviderError('not_configured', 'کلید Gemini تنظیم نشده است.')
    const models = [s.llm.primaryModel, ...(s.llm.fallbackModel && s.llm.fallbackModel !== s.llm.primaryModel ? [s.llm.fallbackModel] : [])]
    let last: unknown
    for (const [i, model] of models.entries()) {
      try { return { text: await geminiGenerate(f, key.value, model, prompt, { temperature: s.llm.temperature, json: true }), model, fallback: i > 0 } }
      catch (e) { last = e; if (e instanceof ProviderError && e.code === 'invalid_key') throw e }
    }
    throw last
  }

  /** جست‌وجوی وب با چند عبارت (مثلاً فارسی برای سایت‌های داخلی + انگلیسی برای خارجی)؛ نتایج بدون تکرار آدرس. */
  async function webSources(queries: string[]): Promise<{ sources: WebResult[]; warning?: string }> {
    const s = await loadAiSettings(store)
    if (!s.webSearch.enabled) return { sources: [], warning: 'جست‌وجوی وب در «تنظیمات API» خاموش است؛ بدون منبع وب تولید شد.' }
    const key = await secrets.get('tavily')
    if (!key) return { sources: [], warning: 'جست‌وجوی وب فعال است اما کلید Tavily تنظیم نشده؛ بدون منبع وب تولید شد.' }
    const seen = new Set<string>(), out: WebResult[] = [], errs: string[] = []
    const parts = await Promise.all(queries.map(async (q) => { try { return await tavilySearch(f, key.value, q, s.webSearch.maxResults) } catch (e) { errs.push((e as Error).message); return [] as WebResult[] } }))
    for (let i = 0; parts.some((p) => i < p.length); i++) for (const p of parts) { const r = p[i]; if (r && !seen.has(r.url)) { seen.add(r.url); out.push(r) } }
    return { sources: out, warning: out.length === 0 && errs.length ? `جست‌وجوی وب ناموفق بود (${errs[0]}); بدون منبع وب تولید شد.` : undefined }
  }

  /** تولید یک مقصد: یک بار تلاش مجدد با فهرست خطاهای اعتبارسنجی. چیزی ذخیره نمی‌کند. */
  async function generateContent(name: string) {
    const tpl = await activeTemplate(store), { sources, warning } = await research(name)
    const base = renderPrompt(tpl.text, name, sources)
    let r = await llm(base), parsed = parseModelOutput(r.text)
    if (!parsed.ok) {
      r = await llm(`${base}\n\nخروجی قبلی شما این خطاها را داشت؛ همان JSON را اصلاح‌شده و کامل دوباره بده:\n${parsed.errors.slice(0, 12).join('\n')}`)
      parsed = parseModelOutput(r.text)
    }
    const meta: AiMeta = { model: r.model, prompt_version: tpl.version, used_fallback: r.fallback, sources: sources.map(({ title, url, snippet }) => ({ title, url, snippet })), generated_at: now().toISOString(), warnings: warning ? [warning] : [] }
    return parsed.ok ? { ok: true as const, content: parsed.value, meta } : { ok: false as const, errors: parsed.errors, meta }
  }

  /** یک یا چند عبارت؛ با چند عبارت، نتایج تکراری حذف و به‌صورت نوبتی (زاویه‌های مختلف) ترکیب می‌شود. */
  async function searchImageCandidates(query: string | string[]): Promise<{ items: ImageCandidate[]; errors: string[] }> {
    const qs = Array.isArray(query) ? query : [query]
    if (qs.length === 1) return searchOne(qs[0], undefined)
    const s = await loadAiSettings(store), per = Math.max(2, Math.ceil((s.imageSearch.maxPerProvider * 1.5) / qs.length))
    const parts = await Promise.all(qs.map((q) => searchOne(q, per))), seen = new Set<string>(), items: ImageCandidate[] = []
    for (let i = 0; parts.some((p) => i < p.items.length); i++) for (const p of parts) { const c = p.items[i]; if (c && !seen.has(c.url)) { seen.add(c.url); items.push(c) } }
    return { items, errors: [...new Set(parts.flatMap((p) => p.errors))] }
  }

  async function searchOne(query: string, perQuery?: number): Promise<{ items: ImageCandidate[]; errors: string[] }> {
    const s = await loadAiSettings(store), items: ImageCandidate[] = [], errors: string[] = []
    const limit = perQuery ?? s.imageSearch.maxPerProvider
    for (const p of s.imageSearch.providers) {
      try {
        if (p === 'wikimedia') items.push(...await wikimediaImages(f, query, limit))
        else { const k = await secrets.get('unsplash'); if (!k) { errors.push('Unsplash: کلید تنظیم نشده است.'); continue } items.push(...await unsplashImages(f, k.value, query, limit)) }
      } catch (e) { errors.push(`${p}: ${(e as Error).message}`) }
    }
    return { items, errors }
  }

  /** نامزدهای تازه را ذخیره می‌کند (همه با وضعیت «candidate»؛ تأیید فقط دستی است)؛ آدرس‌های تکراری رد می‌شوند. */
  async function storeCandidates(suggestionId: number, items: ImageCandidate[]): Promise<ImageRow[]> {
    const have = new Set((await store.listImages(suggestionId)).map((i) => i.url)), out: ImageRow[] = []
    for (const c of items) { if (have.has(c.url)) continue; have.add(c.url); out.push(await store.addImage({ suggestion_id: suggestionId, ...c, status: 'candidate', created_at: now().toISOString(), decided_at: null })) }
    return out
  }

  async function testProvider(name: 'gemini' | 'tavily' | 'unsplash' | 'wikimedia') {
    const t0 = Date.now(), done = (ok: boolean, message: string) => ({ ok, message, latency_ms: Date.now() - t0 })
    try {
      if (name === 'wikimedia') { const r = await wikimediaImages(f, 'Isfahan', 1); return done(true, `اتصال برقرار است (${r.length} نتیجهٔ آزمایشی).`) }
      const key = await secrets.get(name); if (!key) return done(false, 'کلید تنظیم نشده است.')
      if (name === 'gemini') {
        const s = await loadAiSettings(store), models = [s.llm.primaryModel, s.llm.fallbackModel].filter(Boolean), errs: string[] = []
        for (const m of models) {
          try { await geminiGenerate(f, key.value, m, 'Reply with the single word: ok', { maxOutputTokens: 16 }); return done(true, `کلید معتبر است و مدل ${m} پاسخ داد.${errs.length ? ' (مدل‌های ناموفق: ' + errs.join('، ') + ')' : ''}`) }
          catch (e) { if (e instanceof ProviderError && e.code === 'invalid_key') throw e; errs.push(`${m}: ${(e as Error).message}`) }
        }
        return done(false, errs.join(' | '))
      }
      if (name === 'tavily') { await tavilySearch(f, key.value, 'test', 1); return done(true, 'کلید معتبر است.') }
      await unsplashImages(f, key.value, 'test', 1); return done(true, 'کلید معتبر است.')
    } catch (e) { return done(false, (e as Error).message) }
  }

  return { generateContent, searchImageCandidates, storeCandidates, testProvider, dupKey, llm, webSources }
}
export type AiService = ReturnType<typeof createAiService>
