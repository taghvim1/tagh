import { randomInt, randomUUID } from 'node:crypto'
import type { AiService } from '../ai/service.js'
import type { Store } from '../store/types.js'
import { ProviderError } from '../ai/providers.js'
import { bookingFor } from './booking.js'
import { DEFAULT_PACKAGE_PROMPT, renderPackagePrompt } from './prompt.js'
import { modelOutput, type PackageContent, type PackageImage, type PackageInput, type TourPackage } from './schema.js'
import type { Pusher, PushSub } from './push.js'
import { issuesOf } from '../domain/schema.js'

const KEY = 'package_settings', JOBS_KEY = 'package_jobs:v1'
export interface PackageSettings { enabled: boolean; prompt: string }
export const DEFAULT_PACKAGE_SETTINGS: PackageSettings = { enabled: true, prompt: DEFAULT_PACKAGE_PROMPT }

export async function loadPackageSettings(store: Store): Promise<PackageSettings> {
  try { const v = JSON.parse((await store.getKV(KEY)) ?? 'null') as Partial<PackageSettings> | null; return { enabled: v?.enabled !== false, prompt: typeof v?.prompt === 'string' && v.prompt.trim() ? v.prompt : DEFAULT_PACKAGE_PROMPT } } catch { return DEFAULT_PACKAGE_SETTINGS }
}

const fmt = (n: number) => (n >= 1_000_000 ? `${Math.round(n / 100_000) / 10} میلیون` : `${Math.round(n / 1000)} هزار`) + ' تومان'

/** خروجی خام مدل → محتوای نهایی: بررسی تعداد روز، جمع هزینه توسط سرور، و هشدار خودکار اگر از بودجه بیشتر شد. */
export function parsePackage(text: string, input: PackageInput): { ok: true; value: PackageContent } | { ok: false; errors: string[] } {
  let data: unknown
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { return { ok: false, errors: ['خروجی مدل JSON معتبر نبود.'] } }
  if (Array.isArray(data)) data = data[0]
  const r = modelOutput.safeParse(data)
  if (!r.success) return { ok: false, errors: issuesOf(r.error) }
  const v = r.data
  if (v.days.length !== input.days) return { ok: false, errors: [`تعداد روزهای برنامه باید دقیقاً ${input.days} باشد (الان ${v.days.length}).`] }
  const days = v.days.map((d, i) => ({ ...d, day: i + 1 }))
  const total_min = v.cost.items.reduce((s, x) => s + x.min, 0), total_max = v.cost.items.reduce((s, x) => s + x.max, 0)
  const warnings = [...v.warnings]
  if (input.amount_toman && total_min > input.amount_toman) warnings.unshift(`برآورد حداقل هزینه (${fmt(total_min)}) از بودجهٔ شما (${fmt(input.amount_toman)}) بیشتر است؛ روز کمتر یا مقصد نزدیک‌تر را امتحان کنید.`)
  return { ok: true, value: { ...v, days, warnings, cost: { ...v.cost, total_min, total_max } } }
}

export type PackageError = 'disabled' | 'not_configured' | 'quota' | 'unavailable' | 'bad_output'
export type PackageResult = { ok: true; package: TourPackage } | { ok: false; error: PackageError; errors?: string[] }

export interface Job { id: string; status: 'pending' | 'done' | 'failed'; input: PackageInput; created_at: string; finished_at?: string; package?: TourPackage; error?: PackageError; push?: PushSub }
export type PublicJob = Omit<Job, 'push'>
const JOB_TTL = 48 * 3600_000, STALE_MS = 4 * 60_000, MAX_PENDING = 6, MAX_JOBS = 400

export function createPackageService(d: { store: Store; ai: AiService; pusher?: Pusher; now?: () => Date }) {
  const { store, ai, pusher } = d, now = d.now ?? (() => new Date())

  async function generate(input: PackageInput, opts: { force?: boolean } = {}): Promise<PackageResult> {
    const settings = await loadPackageSettings(store)
    if (!settings.enabled && !opts.force) return { ok: false, error: 'disabled' }
    const { sources } = await ai.webSources([
      `${input.destination} جاذبه‌های گردشگری راهنمای سفر`,
      `قیمت بلیط ${input.vehicle} ${input.origin} به ${input.destination}`,
      `هزینه اقامت هتل ${input.destination}`,
    ])
    const base = renderPackagePrompt(settings.prompt, input, sources)
    try {
      let r = await ai.llm(base), p = parsePackage(r.text, input)
      if (!p.ok) { r = await ai.llm(`${base}\n\nخروجی قبلی این خطاها را داشت؛ همان JSON را اصلاح‌شده و کامل بده:\n${p.errors.slice(0, 10).join('\n')}`); p = parsePackage(r.text, input) }
      if (!p.ok) return { ok: false, error: 'bad_output', errors: p.errors }
      return { ok: true, package: { id: randomUUID(), input, content: p.value, images: await pickImages(p.value.image_query, input.destination), booking: bookingFor(input), generated_at: now().toISOString() } }
    } catch (e) {
      if (e instanceof ProviderError) return { ok: false, error: e.code === 'quota' ? 'quota' : e.code === 'not_configured' || e.code === 'invalid_key' ? 'not_configured' : 'unavailable' }
      return { ok: false, error: 'unavailable' }
    }
  }

  /** تا ۴ تصویر دارای مجوز و متنوع (ترتیب تصادفی). */
  async function pickImages(query: string, destination: string): Promise<PackageImage[]> {
    try {
      const { items } = await ai.searchImageCandidates([query, `${destination} landmark`, `${destination} old town street`, `${destination} nature view`])
      const ok = items.filter((i) => i.license)
      for (let i = ok.length - 1; i > 0; i--) { const j = randomInt(i + 1);[ok[i], ok[j]] = [ok[j], ok[i]] }
      return ok.slice(0, 4).map((c) => ({ url: c.url, attribution: c.attribution, source_url: c.source_url, license: c.license }))
    } catch { return [] }
  }

  // ---- کارهای پس‌زمینه: طراحی روی سرور ادامه می‌یابد حتی اگر کاربر از برنامه بیرون برود ----
  let chain: Promise<unknown> = Promise.resolve()
  const tx = <T>(fn: (jobs: Job[]) => T): Promise<T> => {
    const run = chain.then(async () => {
      let jobs: Job[] = []; try { const v = JSON.parse((await store.getKV(JOBS_KEY)) ?? '[]'); if (Array.isArray(v)) jobs = v } catch { /* خالی */ }
      const t = now().getTime(); jobs = jobs.filter((j) => t - Date.parse(j.created_at) < JOB_TTL).slice(-MAX_JOBS)
      const out = fn(jobs); await store.setKV(JOBS_KEY, JSON.stringify(jobs)); return out
    })
    chain = run.catch(() => undefined); return run
  }
  const strip = ({ push: _p, ...j }: Job): PublicJob => j

  async function start(input: PackageInput, push?: PushSub): Promise<{ ok: true; id: string } | { ok: false; error: 'disabled' | 'busy' }> {
    if (!(await loadPackageSettings(store)).enabled) return { ok: false, error: 'disabled' }
    const job: Job = { id: randomUUID(), status: 'pending', input, created_at: now().toISOString(), ...(push ? { push } : {}) }
    const accepted = await tx((jobs) => { if (jobs.filter((j) => j.status === 'pending').length >= MAX_PENDING) return false; jobs.push(job); return true })
    if (!accepted) return { ok: false, error: 'busy' }
    void run(job.id, input)
    return { ok: true, id: job.id }
  }
  async function run(id: string, input: PackageInput) {
    const r = await generate(input).catch((): PackageResult => ({ ok: false, error: 'unavailable' }))
    const sub = await tx((jobs) => {
      const j = jobs.find((x) => x.id === id); if (!j) return undefined
      j.finished_at = now().toISOString()
      if (r.ok) { j.status = 'done'; j.package = r.package } else { j.status = 'failed'; j.error = r.error }
      const s = j.push; delete j.push; return s // اشتراک اعلان بعد از استفاده پاک می‌شود
    })
    if (sub && pusher) void pusher.send(sub, r.ok ? { title: 'پکیج تور آماده شد', body: `${input.origin} ← ${input.destination}، ${input.days} روز`, url: `/package?job=${id}`, tag: `pkg-${id}` } : { title: 'طراحی پکیج ناموفق بود', body: 'دوباره امتحان کنید.', url: '/package', tag: `pkg-${id}` })
  }
  async function job(id: string): Promise<PublicJob | null> {
    return tx((jobs) => {
      const j = jobs.find((x) => x.id === id); if (!j) return null
      if (j.status === 'pending' && now().getTime() - Date.parse(j.created_at) > STALE_MS) { j.status = 'failed'; j.error = 'unavailable'; delete j.push } // سرور وسط کار ری‌استارت شده
      return strip(j)
    })
  }

  return { generate, start, job, settings: () => loadPackageSettings(store), save: (s: PackageSettings) => store.setKV(KEY, JSON.stringify(s)), publicKey: () => pusher?.publicKey() ?? Promise.resolve('') }
}
export type PackageService = ReturnType<typeof createPackageService>
