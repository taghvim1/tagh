import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ImageRow, PromptRow, Store, SuggestionRow, SuggestionQuery, VersionRow } from './types.js'

interface State { seq: number; suggestions: SuggestionRow[]; versions: VersionRow[]; images: ImageRow[]; prompts: PromptRow[]; kv: Record<string, string> }
const empty = (): State => ({ seq: 0, suggestions: [], versions: [], images: [], prompts: [], kv: {} })

/**
 * ذخیره‌سازی آزمایشی: همه‌چیز در حافظه و (اگر مسیر داده شود) روی یک فایل JSON با نوشتن اتمی.
 * ماندگار نیست مگر دیسک پایدار باشد؛ برای تولید باید با پیاده‌سازی PostgreSQL جایگزین شود.
 */
export async function createJsonStore(file?: string): Promise<Store> {
  let s = empty()
  if (file) {
    try { s = { ...empty(), ...JSON.parse(await readFile(file, 'utf8')) } } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('فایل ذخیره‌سازی خراب است؛ برای جلوگیری از از دست رفتن داده، سرور بالا نیامد.') }
  }
  let chain: Promise<void> = Promise.resolve()
  const save = () => {
    if (!file) return Promise.resolve()
    const snapshot = JSON.stringify(s)
    chain = chain.then(async () => { await mkdir(dirname(file), { recursive: true }); await writeFile(file + '.tmp', snapshot); await rename(file + '.tmp', file) })
    return chain
  }
  const id = () => ++s.seq
  const clone = <T,>(v: T): T => structuredClone(v)
  const now = () => new Date().toISOString()
  void now

  const matches = (r: SuggestionRow, q: SuggestionQuery) => {
    if (q.scope && r.content.scope !== q.scope) return false
    if (q.q) { const n = q.q.trim().toLowerCase(); if (n && !`${r.name} ${r.country} ${r.content.province_or_city} ${r.content.type.join(' ')}`.toLowerCase().includes(n)) return false }
    return true
  }

  return {
    async listSuggestions(q) {
      const base = s.suggestions.filter((r) => matches(r, q))
      const counts: Record<string, number> = { all: base.length }
      for (const r of base) counts[r.status] = (counts[r.status] ?? 0) + 1
      const key = q.sort ?? 'updated'
      const items = base.filter((r) => !q.status || r.status === q.status).sort((a, b) => {
        const c = key === 'name' ? a.name.localeCompare(b.name, 'fa') : key === 'created' ? a.created_at.localeCompare(b.created_at) : a.updated_at.localeCompare(b.updated_at)
        return (q.order === 'asc' ? c : -c) || b.id - a.id
      })
      return { items: clone(items.slice(q.offset, q.offset + q.limit)), total: items.length, counts }
    },
    allSuggestions: async () => clone(s.suggestions),
    getSuggestion: async (i) => clone(s.suggestions.find((r) => r.id === i) ?? null),
    async insertSuggestion(row) { const r = { ...clone(row), id: id() }; s.suggestions.push(r); await save(); return clone(r) },
    async updateSuggestion(i, patch) {
      const r = s.suggestions.find((x) => x.id === i); if (!r) return null
      Object.assign(r, clone(patch)); await save(); return clone(r)
    },
    async deleteSuggestion(i) {
      const n = s.suggestions.length
      s.suggestions = s.suggestions.filter((r) => r.id !== i); s.versions = s.versions.filter((v) => v.suggestion_id !== i); s.images = s.images.filter((m) => m.suggestion_id !== i)
      await save(); return s.suggestions.length < n
    },
    async addVersion(row) { const r = { ...clone(row), id: id() }; s.versions.push(r); await save(); return clone(r) },
    listVersions: async (i) => clone(s.versions.filter((v) => v.suggestion_id === i).sort((a, b) => b.version - a.version)),
    async addImage(row) { const r = { ...clone(row), id: id() }; s.images.push(r); await save(); return clone(r) },
    listImages: async (i) => clone(s.images.filter((m) => m.suggestion_id === i)),
    getImage: async (i) => clone(s.images.find((m) => m.id === i) ?? null),
    async updateImage(i, patch) { const r = s.images.find((m) => m.id === i); if (!r) return null; Object.assign(r, clone(patch)); await save(); return clone(r) },
    async deleteImage(i) { const n = s.images.length; s.images = s.images.filter((m) => m.id !== i); await save(); return s.images.length < n },
    listPrompts: async () => clone([...s.prompts].sort((a, b) => b.version - a.version)),
    async addPrompt(row) {
      const r: PromptRow = { ...clone(row), id: id(), version: Math.max(0, ...s.prompts.map((p) => p.version)) + 1, active: false }
      s.prompts.push(r); await save(); return clone(r)
    },
    async activatePrompt(i) {
      const r = s.prompts.find((p) => p.id === i); if (!r) return null
      s.prompts.forEach((p) => { p.active = p.id === i }); await save(); return clone(r)
    },
    getKV: async (k) => s.kv[k] ?? null,
    async setKV(k, v) { s.kv[k] = v; await save() },
    async deleteKV(k) { delete s.kv[k]; await save() },
    close: async () => { await chain },
  }
}
