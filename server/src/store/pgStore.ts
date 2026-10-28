import type { ConsentRow, EventRow, ImageRow, PromptRow, Store, SuggestionQuery, SuggestionRow, VersionRow } from './types.js'

/** یک تابع کوئری (متن با $1…، پارامترها) که ردیف‌ها را برمی‌گرداند؛ با postgres.js در تولید و با PGlite در تست پر می‌شود. */
export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>

const iso = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString())
const num = (v: unknown): number | null => (v == null ? null : Number(v))
const obj = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v)
const json = (v: unknown) => (v == null ? null : JSON.stringify(v))

const suggestion = (r: Record<string, unknown>): SuggestionRow => ({
  id: Number(r.id), status: r.status as SuggestionRow['status'], source: r.source as SuggestionRow['source'], name: String(r.name), country: String(r.country),
  content: obj(r.content) as SuggestionRow['content'], version: Number(r.version), cover_image_id: num(r.cover_image_id), reject_reason: (r.reject_reason as string | null) ?? null,
  ai_meta: r.ai_meta == null ? null : (obj(r.ai_meta) as SuggestionRow['ai_meta']), created_at: iso(r.created_at)!, updated_at: iso(r.updated_at)!, published_at: iso(r.published_at),
})
const version = (r: Record<string, unknown>): VersionRow => ({ id: Number(r.id), suggestion_id: Number(r.suggestion_id), version: Number(r.version), content: obj(r.content) as VersionRow['content'], note: String(r.note), created_at: iso(r.created_at)! })
const image = (r: Record<string, unknown>): ImageRow => ({
  id: Number(r.id), suggestion_id: Number(r.suggestion_id), url: String(r.url), thumb_url: (r.thumb_url as string | null) ?? null, provider: String(r.provider), source_url: (r.source_url as string | null) ?? null,
  author: (r.author as string | null) ?? null, license: (r.license as string | null) ?? null, license_url: (r.license_url as string | null) ?? null, attribution: (r.attribution as string | null) ?? null,
  status: r.status as ImageRow['status'], created_at: iso(r.created_at)!, decided_at: iso(r.decided_at),
})
const eventRow = (r: Record<string, unknown>): EventRow => ({ event_id: String(r.event_id), anonymous_id: String(r.anonymous_id), event_type: String(r.event_type), occurred_at: iso(r.occurred_at)!, session_id: String(r.session_id), props: (obj(r.props) ?? {}) as Record<string, unknown>, app_version: String(r.app_version), platform: String(r.platform), consent_context: (obj(r.consent_context) ?? {}) as Record<string, boolean>, received_at: iso(r.received_at)! })
const consentRow = (r: Record<string, unknown>): ConsentRow => ({ consent_id: String(r.consent_id), subject_id: String(r.subject_id), kind: String(r.kind), granted: Boolean(r.granted), recorded_at: iso(r.recorded_at)!, policy_version: String(r.policy_version), source: String(r.source), received_at: iso(r.received_at)! })
const inList = (ids: string[], from = 1) => ids.map((_, i) => `$${i + from}`).join(', ') // postgres.js و PGlite هر دو: پارامتر جدا برای هر شناسه (بدون آرایه)
const prompt = (r: Record<string, unknown>): PromptRow => ({ id: Number(r.id), version: Number(r.version), text: String(r.text), note: String(r.note), active: Boolean(r.active), created_at: iso(r.created_at)! })

const SUGGESTION_COLS = ['status', 'source', 'name', 'country', 'content', 'version', 'cover_image_id', 'reject_reason', 'ai_meta', 'created_at', 'updated_at', 'published_at'] as const
const IMAGE_COLS = ['suggestion_id', 'url', 'thumb_url', 'provider', 'source_url', 'author', 'license', 'license_url', 'attribution', 'status', 'created_at', 'decided_at'] as const
const JSONB = new Set(['content', 'ai_meta'])
const sv = (col: string, v: unknown) => (JSONB.has(col) ? json(v) : v ?? null)
const placeholders = (cols: readonly string[]) => cols.map((c, i) => (JSONB.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`)).join(', ')

/** ذخیره‌سازی PostgreSQL با همان رابط Store؛ طرح جدول‌ها از server/migrations/001_init.sql ساخته می‌شود (اجرای تکراری بی‌خطر). */
export async function createPgStore(query: Query, migrationSql: string): Promise<Store> {
  for (const stmt of migrationSql.split(/;\s*\n/).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean)) await query(stmt)

  const one = async (text: string, params: unknown[]) => (await query(text, params))[0]
  const setClause = (patch: Record<string, unknown>, allowed: readonly string[]) => {
    const keys = Object.keys(patch).filter((k) => (allowed as readonly string[]).includes(k))
    return { keys, set: keys.map((k, i) => `${k} = ${JSONB.has(k) ? `$${i + 2}::jsonb` : `$${i + 2}`}`).join(', '), values: keys.map((k) => sv(k, patch[k])) }
  }

  function where(q: SuggestionQuery, params: unknown[]) {
    const w: string[] = []
    if (q.scope) { params.push(q.scope); w.push(`content->>'scope' = $${params.length}`) }
    const n = q.q?.trim().toLowerCase()
    if (n) { params.push(`%${n.replace(/[\\%_]/g, (c) => `\\${c}`)}%`); w.push(`lower(name || ' ' || country || ' ' || coalesce(content->>'province_or_city', '') || ' ' || coalesce(content->'type', '[]'::jsonb)::text) like $${params.length}`) }
    return w.length ? `where ${w.join(' and ')}` : ''
  }

  const store: Store = {
    kind: 'postgres',
    async listSuggestions(q) {
      const p1: unknown[] = []; const base = where(q, p1)
      const countRows = await query(`select status, count(*)::int as n from travel_suggestions ${base} group by status`, p1)
      const counts: Record<string, number> = { all: 0 }
      for (const r of countRows) { counts[String(r.status)] = Number(r.n); counts.all += Number(r.n) }
      const p2: unknown[] = []; let w = where(q, p2)
      if (q.status) { p2.push(q.status); w += `${w ? ' and' : 'where'} status = $${p2.length}` }
      const total = Number((await one(`select count(*)::int as n from travel_suggestions ${w}`, p2))!.n)
      const col = q.sort === 'name' ? 'name' : q.sort === 'created' ? 'created_at' : 'updated_at', dir = q.order === 'asc' ? 'asc' : 'desc'
      p2.push(q.limit, q.offset)
      const rows = await query(`select * from travel_suggestions ${w} order by ${col} ${dir}, id desc limit $${p2.length - 1} offset $${p2.length}`, p2)
      return { items: rows.map(suggestion), total, counts }
    },
    allSuggestions: async () => (await query('select * from travel_suggestions order by id')).map(suggestion),
    getSuggestion: async (id) => { const r = await one('select * from travel_suggestions where id = $1', [id]); return r ? suggestion(r) : null },
    async insertSuggestion(row) {
      const r = row as unknown as Record<string, unknown>
      return suggestion((await one(`insert into travel_suggestions (${SUGGESTION_COLS.join(', ')}) values (${placeholders(SUGGESTION_COLS)}) returning *`, SUGGESTION_COLS.map((c) => sv(c, r[c]))))!)
    },
    async updateSuggestion(id, patch) {
      const { keys, set, values } = setClause(patch as Record<string, unknown>, SUGGESTION_COLS)
      if (!keys.length) return store.getSuggestion(id)
      const r = await one(`update travel_suggestions set ${set} where id = $1 returning *`, [id, ...values]); return r ? suggestion(r) : null
    },
    deleteSuggestion: async (id) => (await query('delete from travel_suggestions where id = $1 returning id', [id])).length > 0,
    async addVersion(row) { return version((await one('insert into travel_suggestion_versions (suggestion_id, version, content, note, created_at) values ($1, $2, $3::jsonb, $4, $5) returning *', [row.suggestion_id, row.version, json(row.content), row.note, row.created_at]))!) },
    listVersions: async (id) => (await query('select * from travel_suggestion_versions where suggestion_id = $1 order by version desc', [id])).map(version),
    async addImage(row) { const r = row as unknown as Record<string, unknown>; return image((await one(`insert into travel_suggestion_images (${IMAGE_COLS.join(', ')}) values (${placeholders(IMAGE_COLS)}) returning *`, IMAGE_COLS.map((c) => sv(c, r[c]))))!) },
    listImages: async (id) => (await query('select * from travel_suggestion_images where suggestion_id = $1 order by id', [id])).map(image),
    getImage: async (id) => { const r = await one('select * from travel_suggestion_images where id = $1', [id]); return r ? image(r) : null },
    async updateImage(id, patch) {
      const { keys, set, values } = setClause(patch as Record<string, unknown>, IMAGE_COLS)
      if (!keys.length) return store.getImage(id)
      const r = await one(`update travel_suggestion_images set ${set} where id = $1 returning *`, [id, ...values]); return r ? image(r) : null
    },
    deleteImage: async (id) => (await query('delete from travel_suggestion_images where id = $1 returning id', [id])).length > 0,
    listPrompts: async () => (await query('select * from prompt_templates order by version desc')).map(prompt),
    async addPrompt(row) { return prompt((await one('insert into prompt_templates (version, text, note, active, created_at) select coalesce(max(version), 0) + 1, $1, $2, false, $3 from prompt_templates returning *', [row.text, row.note, row.created_at]))!) },
    async activatePrompt(id) {
      if (id === -1) { await query('update prompt_templates set active = false where active'); return null } // بازنشانی به قالب پیش‌فرض
      if (!(await one('select id from prompt_templates where id = $1', [id]))) return null
      await query('update prompt_templates set active = false where active and id <> $1', [id])
      return prompt((await one('update prompt_templates set active = true where id = $1 returning *', [id]))!)
    },
    async addConsents(rows) {
      let n = 0
      for (const r of rows) n += (await query('insert into consent_records (consent_id, subject_id, kind, granted, recorded_at, policy_version, source, received_at) values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (consent_id) do nothing returning consent_id', [r.consent_id, r.subject_id, r.kind, r.granted, r.recorded_at, r.policy_version, r.source, r.received_at])).length
      return n
    },
    async latestConsents(subject) {
      const rows = await query('select distinct on (kind) kind, granted from consent_records where subject_id = $1 order by kind, recorded_at desc', [subject])
      return Object.fromEntries(rows.map((r) => [String(r.kind), Boolean(r.granted)]))
    },
    async addEvents(rows) {
      let inserted = 0
      for (const e of rows) inserted += (await query('insert into activity_events (event_id, anonymous_id, event_type, occurred_at, session_id, props, app_version, platform, consent_context, received_at) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::jsonb, $10) on conflict (event_id) do nothing returning event_id', [e.event_id, e.anonymous_id, e.event_type, e.occurred_at, e.session_id, json(e.props ?? {}), e.app_version, e.platform, json(e.consent_context), e.received_at])).length
      return { inserted, duplicates: rows.length - inserted }
    },
    async eventStats() { const r = await one('select (select count(*) from activity_events)::int as events, (select count(*) from consent_records)::int as consents', []); return { events: Number(r!.events), consents: Number(r!.consents) } },
    async eventsOf(anonIds, { limit, offset = 0 }) {
      if (!anonIds.length) return { items: [], total: 0 }
      const n = anonIds.length
      const rows = await query(`select * from activity_events where anonymous_id in (${inList(anonIds)}) order by occurred_at desc, event_id desc limit $${n + 1} offset $${n + 2}`, [...anonIds, limit, offset])
      const c = await one(`select count(*)::int as n from activity_events where anonymous_id in (${inList(anonIds)})`, anonIds)
      return { items: rows.map(eventRow), total: Number(c!.n) }
    },
    async eventsSince(since, limit) { return (await query('select * from activity_events where occurred_at >= $1 order by occurred_at desc limit $2', [since, limit])).map(eventRow) },
    async consentsOf(anonIds) { return anonIds.length ? (await query(`select * from consent_records where subject_id in (${inList(anonIds)}) order by recorded_at asc, consent_id asc`, anonIds)).map(consentRow) : [] },
    async deleteSubjects(anonIds) {
      if (!anonIds.length) return { events: 0, consents: 0 }
      const ev = await query(`delete from activity_events where anonymous_id in (${inList(anonIds)}) returning event_id`, anonIds)
      const co = await query(`delete from consent_records where subject_id in (${inList(anonIds)}) returning consent_id`, anonIds)
      return { events: ev.length, consents: co.length }
    },
    getKV: async (k) => { const r = await one('select value from app_settings where key = $1', [k]); return r ? String(r.value) : null },
    async setKV(k, v) { await query('insert into app_settings (key, value, updated_at) values ($1, $2, now()) on conflict (key) do update set value = excluded.value, updated_at = now()', [k, v]) },
    async deleteKV(k) { await query('delete from app_settings where key = $1', [k]) },
    close: async () => undefined,
  }
  return store
}
export type { EventRow, ConsentRow }
