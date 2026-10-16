import type { AiService } from '../ai/service.js'
import type { ImageCandidate } from '../ai/providers.js'
import { issuesOf } from '../domain/schema.js'
import type { Store } from '../store/types.js'
import {
  canFeedTransition, FEED_KINDS, feedContentSchema, feedGenSchema, jalaliContext, normTitle, tehranDate, TOPICS,
  type FeedContent, type FeedImage, type FeedItem, type FeedKind, type FeedSource, type FeedStatus,
} from './schema.js'

const KEY = 'feed_v1'
interface State { seq: number; imgSeq: number; items: FeedItem[] }

export interface PublicFeedItem {
  id: number; kind: FeedKind; title: string; body: string; place?: string; facts: { label: string; value: string }[]
  image: { url: string; attribution: string | null; source_url: string | null; license: string | null; author: string | null }
  sources: FeedSource[]; published_date: string
}

/** شرط‌های ورود به صف (و انتشار): تصویر اصلیِ دارای مجوز، حداقل یک منبع، و نبودن عنوان تکراری */
export function queueCheck(item: FeedItem, all: FeedItem[]): string[] {
  const out: string[] = []
  const cover = item.images.find((i) => i.id === item.cover_image_id)
  if (!cover) out.push('تصویر اصلی انتخاب نشده است.')
  else if (!cover.license?.trim()) out.push('تصویر اصلی مجوز مشخص ندارد.')
  if (item.sources.length === 0) out.push('حداقل یک منبع لازم است (در پایین پاپ‌آپ برای کاربر نمایش داده می‌شود). منبع را دستی اضافه کنید یا جست‌وجوی وب را در «تنظیمات API» روشن کنید.')
  const t = normTitle(item.content.title)
  const dup = all.find((x) => x.id !== item.id && x.kind === item.kind && (x.status === 'queued' || x.status === 'published') && normTitle(x.content.title) === t)
  if (dup) out.push(`کارتی با همین عنوان در صف یا منتشرشده‌ها هست (#${dup.id}).`)
  return out
}

const toPublic = (it: FeedItem): PublicFeedItem | null => {
  const c = it.images.find((i) => i.id === it.cover_image_id)
  if (!c || !c.license?.trim() || !it.published_date) return null
  return {
    id: it.id, kind: it.kind, title: it.content.title, body: it.content.body, ...(it.content.place ? { place: it.content.place } : {}), facts: it.content.facts,
    image: { url: c.url, attribution: c.attribution, source_url: c.source_url, license: c.license, author: c.author },
    sources: it.sources, published_date: it.published_date,
  }
}

const SEASON_EN: Record<string, string> = { بهار: 'spring', تابستان: 'summer', پاییز: 'autumn', زمستان: 'winter' }

export function createFeedService(deps: { store: Store; ai: AiService; now?: () => Date }) {
  const { store, ai } = deps, nowFn = deps.now ?? (() => new Date())
  const iso = () => nowFn().toISOString()

  const load = async (): Promise<State> => {
    const raw = await store.getKV(KEY)
    if (!raw) return { seq: 0, imgSeq: 0, items: [] }
    try { const s = JSON.parse(raw) as State; return { seq: s.seq ?? 0, imgSeq: s.imgSeq ?? 0, items: Array.isArray(s.items) ? s.items : [] } } catch { return { seq: 0, imgSeq: 0, items: [] } }
  }
  // همهٔ تغییرها پشت‌سرهم اجرا می‌شوند (خواندن-تغییر-نوشتن روی یک مقدار KV)
  let chain: Promise<unknown> = Promise.resolve()
  function tx<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
    const run = chain.then(async () => { const s = await load(); const r = await fn(s); await store.setKV(KEY, JSON.stringify(s)); return r })
    chain = run.catch(() => undefined)
    return run
  }
  const find = (s: State, id: number) => s.items.find((i) => i.id === id)

  const queued = (items: FeedItem[], kind: FeedKind) => items.filter((i) => i.kind === kind && i.status === 'queued').sort((a, b) => (a.queued_at ?? '').localeCompare(b.queued_at ?? '') || a.id - b.id)

  const withExtras = (items: FeedItem[], it: FeedItem) => ({
    ...it,
    queue_position: it.status === 'queued' ? queued(items, it.kind).findIndex((x) => x.id === it.id) + 1 : null,
    blocking: it.status === 'draft' || it.status === 'rejected' || it.status === 'queued' ? queueCheck(it, items) : [],
  })

  function publishNow(s: State, it: FeedItem, today: string) {
    it.status = 'published'; it.published_at = iso(); it.published_date = today; it.updated_at = iso()
  }

  /** برای هر موضوع: اگر امروز چیزی منتشر نشده، اولین کارت معتبر صف منتشر می‌شود. */
  function rotate(s: State, today: string) {
    for (const kind of FEED_KINDS) {
      if (s.items.some((i) => i.kind === kind && i.status === 'published' && i.published_date === today)) continue
      for (const cand of queued(s.items, kind)) {
        const problems = queueCheck(cand, s.items).filter((p) => !p.startsWith('کارتی با همین عنوان')) // تکراری بودن هنگام ورود به صف سنجیده شده
        if (problems.length) { cand.status = 'draft'; cand.queued_at = null; cand.updated_at = iso(); cand.ai_meta = { ...(cand.ai_meta ?? { warnings: [] }), warnings: [...(cand.ai_meta?.warnings ?? []), `از صف خارج شد: ${problems[0]}`] }; continue }
        publishNow(s, cand, today); break
      }
    }
  }

  function currentFor(s: State, kind: FeedKind, today: string): FeedItem | null {
    const pub = s.items.filter((i) => i.kind === kind && i.status === 'published' && i.published_date)
    const todays = pub.filter((i) => i.published_date === today)
    const pool = todays.length ? todays : pub
    return pool.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '') || b.id - a.id)[0] ?? null
  }

  async function get(id: number) { const s = await load(); const it = find(s, id); return it ? withExtras(s.items, it) : null }

  function create(kind: FeedKind, content: FeedContent, sources: FeedSource[], source: 'ai' | 'manual' = 'manual', meta: FeedItem['ai_meta'] = null) {
    return tx((s) => {
      const t = iso()
      const it: FeedItem = { id: ++s.seq, kind, status: 'draft', source, content, sources, images: [], cover_image_id: null, cover_auto: false, ai_meta: meta, reject_reason: null, created_at: t, updated_at: t, queued_at: null, published_at: null, published_date: null }
      s.items.push(it); return structuredClone(it)
    })
  }

  function addImages(id: number, cands: Omit<FeedImage, 'id'>[], opts: { autoCover?: boolean } = {}) {
    return tx((s) => {
      const it = find(s, id); if (!it) return null
      const have = new Set(it.images.map((i) => i.url))
      for (const c of cands) {
        if (have.has(c.url)) continue
        have.add(c.url); it.images.push({ ...c, id: ++s.imgSeq })
      }
      if (opts.autoCover && it.cover_image_id === null) { const first = it.images.find((i) => i.license?.trim()); if (first) { it.cover_image_id = first.id; it.cover_auto = true } }
      it.updated_at = iso(); return structuredClone(it)
    })
  }

  /** جست‌وجوی تصویر برای یک کارت و افزودن نامزدها؛ با autoCover اگر تصویر اصلی ندارد اولین تصویرِ دارای مجوز انتخاب می‌شود. */
  async function searchImages(id: number, query?: string, autoCover = false) {
    const it = await get(id); if (!it) return null
    const qs = query?.trim() ? [query.trim()] : it.content.image_queries.length ? it.content.image_queries : [[it.content.place, it.content.title].filter(Boolean).join(' ')]
    const r = await ai.searchImageCandidates(qs)
    const cands = r.items.map(({ url, thumb_url, provider, source_url, author, license, license_url, attribution }: ImageCandidate) => ({ url, thumb_url, provider, source_url, author, license, license_url, attribution }))
    const before = it.images.length
    const item = await addImages(id, cands, { autoCover })
    return { added: item ? item.images.length - before : 0, errors: r.errors, item }
  }

  const api = {
    /** API عمومی: امروزِ هر موضوع (با انتشار نوبتی از صف). فقط کارت‌های دارای تصویر و مجوز. */
    async publicFeed() {
      const today = tehranDate(nowFn())
      const items = await tx((s) => {
        rotate(s, today)
        const out: Partial<Record<FeedKind, PublicFeedItem>> = {}
        for (const k of FEED_KINDS) { const it = currentFor(s, k, today); const p = it && toPublic(it); if (p) out[k] = p }
        return out
      })
      return { date: today, items }
    },

    async summary() {
      const s = await load(), today = tehranDate(nowFn())
      return FEED_KINDS.map((kind) => {
        const mine = s.items.filter((i) => i.kind === kind)
        const count = (st: FeedStatus) => mine.filter((i) => i.status === st).length
        const cur = currentFor(s, kind, today)
        return { kind, title: TOPICS[kind].title, counts: { draft: count('draft'), queued: count('queued'), published: count('published'), rejected: count('rejected') }, today: cur ? { id: cur.id, title: cur.content.title, published_date: cur.published_date } : null }
      })
    },

    async list(kind: FeedKind, status?: FeedStatus) {
      const s = await load()
      const rows = s.items.filter((i) => i.kind === kind && (!status || i.status === status))
      const key = (i: FeedItem) => (i.status === 'queued' ? 0 : i.status === 'draft' ? 1 : i.status === 'published' ? 2 : 3)
      rows.sort((a, b) => key(a) - key(b) || (a.status === 'queued' ? (a.queued_at ?? '').localeCompare(b.queued_at ?? '') : b.updated_at.localeCompare(a.updated_at)) || b.id - a.id)
      return rows.map((r) => withExtras(s.items, r))
    },

    get,

    create,

    /** ویرایش متن/منابع: فقط پیش‌نویس و ردشده */
    update(id: number, patch: { content?: FeedContent; sources?: FeedSource[] }) {
      return tx((s): { ok: true; item: FeedItem } | { ok: false; code: number; error: string } => {
        const it = find(s, id); if (!it) return { ok: false, code: 404, error: 'not_found' }
        if (it.status === 'queued' || it.status === 'published') return { ok: false, code: 409, error: 'برای ویرایش، ابتدا کارت را از صف/انتشار به پیش‌نویس برگردانید.' }
        if (patch.content) it.content = patch.content
        if (patch.sources) it.sources = patch.sources
        it.updated_at = iso(); return { ok: true, item: structuredClone(it) }
      })
    },

    transition(id: number, to: FeedStatus, reason?: string) {
      return tx((s): { ok: true; item: FeedItem } | { ok: false; code: number; errors: string[] } => {
        const it = find(s, id); if (!it) return { ok: false, code: 404, errors: ['not_found'] }
        if (!canFeedTransition(it.status, to)) return { ok: false, code: 409, errors: [`انتقال از «${it.status}» به «${to}» مجاز نیست.`] }
        if (to === 'rejected' && !reason?.trim()) return { ok: false, code: 400, errors: ['برای رد کردن، دلیل لازم است.'] }
        if (to === 'queued') { const p = queueCheck(it, s.items); if (p.length) return { ok: false, code: 409, errors: p } }
        if (to === 'published') { const p = queueCheck(it, s.items).filter((x) => !x.startsWith('کارتی با همین عنوان')); if (p.length) return { ok: false, code: 409, errors: p }; publishNow(s, it, tehranDate(nowFn())) }
        else {
          it.status = to; it.updated_at = iso()
          it.queued_at = to === 'queued' ? iso() : null
          it.published_at = null; it.published_date = null
          it.reject_reason = to === 'rejected' ? reason!.trim() : null
        }
        return { ok: true, item: structuredClone(it) }
      })
    },

    remove(id: number) {
      return tx((s): { ok: true } | { ok: false; code: number; error: string } => {
        const it = find(s, id); if (!it) return { ok: false, code: 404, error: 'not_found' }
        if (it.status === 'published' || it.status === 'queued') return { ok: false, code: 409, error: 'کارت منتشرشده یا در صف حذف نمی‌شود؛ ابتدا به پیش‌نویس برگردانید.' }
        s.items = s.items.filter((x) => x.id !== id); return { ok: true }
      })
    },

    addImages,

    setCover(id: number, imageId: number) {
      return tx((s): { ok: true; item: FeedItem } | { ok: false; code: number; error: string } => {
        const it = find(s, id); if (!it) return { ok: false, code: 404, error: 'not_found' }
        const img = it.images.find((i) => i.id === imageId); if (!img) return { ok: false, code: 404, error: 'تصویر پیدا نشد.' }
        if (!img.license?.trim()) return { ok: false, code: 409, error: 'تصویر بدون مجوز مشخص قابل انتخاب نیست.' }
        if (it.status === 'published') return { ok: false, code: 409, error: 'تصویر کارت منتشرشده تغییر نمی‌کند؛ ابتدا انتشار را لغو کنید.' }
        it.cover_image_id = img.id; it.cover_auto = false; it.updated_at = iso()
        return { ok: true, item: structuredClone(it) }
      })
    },

    removeImage(id: number, imageId: number) {
      return tx((s): { ok: true; item: FeedItem } | { ok: false; code: number; error: string } => {
        const it = find(s, id); if (!it) return { ok: false, code: 404, error: 'not_found' }
        if (it.cover_image_id === imageId && (it.status === 'published' || it.status === 'queued')) return { ok: false, code: 409, error: 'تصویر اصلیِ کارت در صف/منتشرشده حذف نمی‌شود.' }
        it.images = it.images.filter((i) => i.id !== imageId)
        if (it.cover_image_id === imageId) { it.cover_image_id = null; it.cover_auto = false }
        it.updated_at = iso(); return { ok: true, item: structuredClone(it) }
      })
    },

    searchImages,

    /** تولید با هوش مصنوعی: جست‌وجوی وب (فارسی + انگلیسی) → مدل → پیش‌نویس + جست‌وجو و انتخاب خودکار تصویر. */
    async generate(kind: FeedKind, opts: { count: number; hint?: string }) {
      const topic = TOPICS[kind], ctx = jalaliContext(nowFn()), hint = (opts.hint ?? '').trim()
      const fill = (t: string, en: boolean) => t.replaceAll('{month}', ctx.month).replaceAll('{season}', en ? SEASON_EN[ctx.season] ?? '' : ctx.season).replaceAll('{hint}', hint).replace(/\s+/g, ' ').trim()
      const { sources, warning } = await ai.webSources([fill(topic.searchFa, false), fill(topic.searchEn, true)])
      const existing = (await load()).items.filter((i) => i.kind === kind && i.status !== 'rejected')
      const prior = existing.slice(-60).map((i) => `- ${i.content.title}`).join('\n') || '(هنوز عنوانی نیست)'
      const src = sources.length ? sources.map((x, i) => `[${i + 1}] ${x.title} (${x.url})${x.snippet ? `\n    ${x.snippet}` : ''}`).join('\n') : '(منبع وبی در دسترس نیست؛ فقط به دانستهٔ کاملاً مطمئن و شناخته‌شده تکیه کن و source_refs را خالی بگذار)'
      const base = `تو ویراستار محتوای یک اپ تقویم سفر هستی. ${opts.count} کارت «${topic.title}» به فارسی بساز و فقط یک آرایهٔ JSON معتبر (بدون هیچ توضیح اضافه) برگردان.

امروز: ${ctx.day} ${ctx.month} (${ctx.season}).
نوع کارت: ${topic.brief}
${hint ? `موضوع یا مقصد درخواستی مدیر: ${hint}\n` : ''}
قواعد:
- فقط اطلاعات واقعی و قابل‌اتکا؛ هیچ واقعیت، عدد، قیمت، تاریخ یا نامی نساز. اگر مطمئن نیستی آن را ننویس.
- اگر «منابع وب» آمده، محتوا را بر پایهٔ همان‌ها بنویس و در source_refs شمارهٔ منابعی را بیاور که واقعاً از آن‌ها استفاده کرده‌ای. اگر از منبعی استفاده نکردی source_refs خالی باشد.
- کارت‌ها باید با هم و با «عنوان‌های قبلی» متفاوت باشند؛ مقصد یا نکتهٔ تکراری ننویس.
- title کوتاه و جذاب (حداکثر ۹۰ نویسه)؛ body دو تا چهار جملهٔ مشخص و روان (حداکثر ۱۲۰۰ نویسه)؛ place نام مکان (اختیاری).
- facts: آرایه‌ای از {"label","value"}${topic.factLabels.length ? `؛ برچسب‌های پیشنهادی: ${topic.factLabels.join('، ')}` : ' (اختیاری)'}؛ فقط موارد مطمئن.
- image_queries: ۲ تا ۳ عبارت انگلیسی برای جست‌وجوی عکسِ مرتبط، شامل نام دقیق مکان یا موضوع (مثلاً "Masuleh village Iran").

قالب خروجی:
[ { "title": "", "body": "", "place": "", "facts": [ { "label": "", "value": "" } ], "image_queries": [ "" ], "source_refs": [ 1 ] } ]

عنوان‌های قبلی (تکرار نکن):
${prior}

منابع وب:
${src}`

      const parse = (text: string) => {
        let data: unknown
        try { data = JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { return { ok: [] as ReturnType<typeof feedGenSchema.parse>[], errors: ['خروجی مدل JSON معتبر نبود.'] } }
        const arr = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items : [data]
        const ok: ReturnType<typeof feedGenSchema.parse>[] = [], errors: string[] = []
        for (const [i, x] of arr.entries()) { const r = feedGenSchema.safeParse(x); if (r.success) ok.push(r.data); else errors.push(...issuesOf(r.error).map((e) => `مورد ${i + 1}: ${e}`)) }
        return { ok, errors }
      }
      let r = await ai.llm(base), parsed = parse(r.text)
      if (parsed.ok.length === 0) { r = await ai.llm(`${base}\n\nخروجی قبلی این خطاها را داشت؛ آرایهٔ JSON کامل و اصلاح‌شده را دوباره بده:\n${parsed.errors.slice(0, 10).join('\n')}`); parsed = parse(r.text) }
      if (parsed.ok.length === 0) return { ok: false as const, errors: parsed.errors, results: [] }

      const meta = { model: r.model, used_fallback: r.fallback, generated_at: iso(), warnings: [...(warning ? [warning] : []), ...(sources.length === 0 ? ['بدون منبع وب تولید شد؛ پیش از ورود به صف منبع را دستی اضافه کنید و صحت متن را بررسی کنید.'] : [])] }
      const seen = new Set(existing.map((i) => normTitle(i.content.title)))
      const results: { id?: number; title: string; ok: boolean; reason?: string; images_added?: number; image_errors?: string[] }[] = []
      const created: { id: number; content: FeedContent }[] = []
      for (const g of parsed.ok.slice(0, opts.count)) {
        const { source_refs, ...content } = g
        const c = feedContentSchema.parse(content)
        if (seen.has(normTitle(c.title))) { results.push({ title: c.title, ok: false, reason: 'عنوان تکراری' }); continue }
        seen.add(normTitle(c.title))
        const used = [...new Set(source_refs)].map((n) => sources[n - 1]).filter(Boolean).map((x) => ({ title: x.title, url: x.url }))
        const item = await create(kind, c, used, 'ai', meta)
        created.push({ id: item.id, content: c }); results.push({ id: item.id, title: c.title, ok: true })
      }
      // تصویر: دو کارت هم‌زمان؛ اولین تصویر دارای مجوز به‌عنوان تصویر اصلی (انتخاب هوشمند اولیه) گذاشته می‌شود و مدیر می‌تواند عوضش کند
      let next = 0
      await Promise.all(Array.from({ length: Math.min(2, created.length) }, async () => {
        while (next < created.length) {
          const c = created[next++], res = results.find((x) => x.id === c.id)!
          try { const s = await searchImages(c.id, undefined, true); res.images_added = s?.added ?? 0; res.image_errors = s?.errors ?? [] } catch (e) { res.images_added = 0; res.image_errors = [(e as Error).message] }
        }
      }))
      return { ok: true as const, results, meta }
    },
  }
  return api
}
export type FeedService = ReturnType<typeof createFeedService>
