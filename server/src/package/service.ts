import { randomInt, randomUUID } from 'node:crypto'
import type { AiService } from '../ai/service.js'
import type { Store } from '../store/types.js'
import { ProviderError } from '../ai/providers.js'
import { DEFAULT_PACKAGE_PROMPT, renderPackagePrompt } from './prompt.js'
import { packageContent, type PackageContent, type PackageInput, type PackageImage, type TourPackage } from './schema.js'
import { issuesOf } from '../domain/schema.js'

const KEY = 'package_settings'
export interface PackageSettings { enabled: boolean; prompt: string }
export const DEFAULT_PACKAGE_SETTINGS: PackageSettings = { enabled: true, prompt: DEFAULT_PACKAGE_PROMPT }

export async function loadPackageSettings(store: Store): Promise<PackageSettings> {
  try { const v = JSON.parse((await store.getKV(KEY)) ?? 'null') as Partial<PackageSettings> | null; return { enabled: v?.enabled !== false, prompt: typeof v?.prompt === 'string' && v.prompt.trim() ? v.prompt : DEFAULT_PACKAGE_PROMPT } } catch { return DEFAULT_PACKAGE_SETTINGS }
}

export function parsePackage(text: string): { ok: true; value: PackageContent } | { ok: false; errors: string[] } {
  let data: unknown
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()) } catch { return { ok: false, errors: ['خروجی مدل JSON معتبر نبود.'] } }
  if (Array.isArray(data)) data = data[0]
  const r = packageContent.safeParse(data)
  return r.success ? { ok: true, value: r.data } : { ok: false, errors: issuesOf(r.error) }
}

export type PackageResult = { ok: true; package: TourPackage } | { ok: false; error: 'disabled' | 'not_configured' | 'quota' | 'unavailable' | 'bad_output'; errors?: string[] }

export function createPackageService(d: { store: Store; ai: AiService; now?: () => Date }) {
  const { store, ai } = d, now = d.now ?? (() => new Date())

  async function generate(input: PackageInput, opts: { force?: boolean } = {}): Promise<PackageResult> {
    const settings = await loadPackageSettings(store)
    if (!settings.enabled && !opts.force) return { ok: false, error: 'disabled' }
    const { sources } = await ai.webSources([`${input.destination} جاذبه‌های گردشگری راهنمای سفر`, `${input.origin} به ${input.destination} ${input.vehicle} مسیر هزینه`])
    const base = renderPackagePrompt(settings.prompt, input, sources)
    try {
      let r = await ai.llm(base), p = parsePackage(r.text)
      if (!p.ok) { r = await ai.llm(`${base}\n\nخروجی قبلی این خطاها را داشت؛ همان JSON را اصلاح‌شده و کامل بده:\n${p.errors.slice(0, 10).join('\n')}`); p = parsePackage(r.text) }
      if (!p.ok) return { ok: false, error: 'bad_output', errors: p.errors }
      return { ok: true, package: { id: randomUUID(), input, content: p.value, image: await pickImage(p.value.image_query, input.destination), sources: sources.slice(0, 5).map(({ title, url }) => ({ title, url })), generated_at: now().toISOString() } }
    } catch (e) {
      if (e instanceof ProviderError) return { ok: false, error: e.code === 'quota' ? 'quota' : e.code === 'not_configured' || e.code === 'invalid_key' ? 'not_configured' : 'unavailable' }
      return { ok: false, error: 'unavailable' }
    }
  }

  /** یک عکس تصادفی از نتایج جست‌وجو (فقط تصاویر https دارای مجوز). */
  async function pickImage(query: string, destination: string): Promise<PackageImage | null> {
    try {
      const { items } = await ai.searchImageCandidates([query, `${destination} landmark`])
      const ok = items.filter((i) => i.license)
      if (!ok.length) return null
      const c = ok[randomInt(ok.length)]
      return { url: c.url, attribution: c.attribution, source_url: c.source_url, license: c.license }
    } catch { return null }
  }

  return { generate, settings: () => loadPackageSettings(store), save: (s: PackageSettings) => store.setKV(KEY, JSON.stringify(s)) }
}
export type PackageService = ReturnType<typeof createPackageService>
