import { CONSENT_KINDS, clearConsent, consentSummary, loadConsentRecords, recordConsent } from './consent'
import { APP_VERSION, clearInstallation, getOrCreateInstallation } from './installation'
import { nowISO, randomId, type KV } from './ids'
import { EVENT_TYPES, type ActivityEvent, type ConsentKind, type ConsentSummary, type EventType } from './types'

export class BackendNotConnectedError extends Error { constructor() { super('BACKEND_NOT_CONNECTED') } }
export interface Transport { send(events: ActivityEvent[]): Promise<void> }
/** هنوز API امنی وجود ندارد؛ هر ارسال با این خطا رد می‌شود و رویدادها در صف می‌مانند. */
export const notConnectedTransport: Transport = { send: async () => { throw new BackendNotConnectedError() } }

export type EventProps = Partial<Pick<ActivityEvent, 'destination_id' | 'tour_id' | 'organizer_id' | 'season' | 'category' | 'budget_range' | 'travel_style' | 'domestic_or_international' | 'filters' | 'duration_sec' | 'query_length' | 'error_code'>>

const OUTBOX_KEY = 'taghvim-outbox-v1'
const SESSION_KEY = 'taghvim-session-v1'
const DELETION_KEY = 'taghvim-deletion-request-v1'
export const OUTBOX_MAX = 500
export const SESSION_GAP_MS = 30 * 60 * 1000
export const DEDUPE_WINDOW_MS = 2000
const str = (v: unknown, n = 40) => (typeof v === 'string' ? v.slice(0, n) : undefined)
const int = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : undefined)

/** فقط فیلدهای مجاز و کوتاه‌شده؛ هر چیز دیگر (متن جست‌وجو، اطلاعات تماس…) دور ریخته می‌شود. */
export function sanitizeProps(p: EventProps): EventProps {
  const out: EventProps = {}
  const set = <K extends keyof EventProps>(k: K, v: EventProps[K] | undefined) => { if (v !== undefined) out[k] = v }
  set('destination_id', int(p.destination_id, 1e9)); set('tour_id', int(p.tour_id, 1e9)); set('organizer_id', int(p.organizer_id, 1e9))
  set('season', str(p.season)); set('category', str(p.category)); set('budget_range', str(p.budget_range)); set('travel_style', str(p.travel_style))
  set('domestic_or_international', p.domestic_or_international === 'domestic' || p.domestic_or_international === 'international' ? p.domestic_or_international : undefined)
  set('filters', Array.isArray(p.filters) ? p.filters.slice(0, 20).map((f) => String(f).slice(0, 30)) : undefined)
  set('duration_sec', int(p.duration_sec, 3600)); set('query_length', int(p.query_length, 200)); set('error_code', str(p.error_code, 60))
  return out
}

export interface TrackerDeps { kv: KV; transport?: Transport; now?: () => Date; platform?: 'web' | 'pwa'; appVersion?: string }
export type FlushResult = { status: 'empty' | 'sent' | 'failed' | 'skipped'; sent: number; code?: string }

export function createTracker(deps: TrackerDeps) {
  const { kv } = deps
  const now = deps.now ?? (() => new Date())
  const transport = deps.transport ?? notConnectedTransport
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  let lastKey = ''
  let lastAt = 0
  let flushing = false
  let retryAt = 0
  let failures = 0

  const installation = () => getOrCreateInstallation(kv, now(), deps.platform ?? 'web')
  const consent = (): ConsentSummary => consentSummary(loadConsentRecords(kv))
  const loadOutbox = (): ActivityEvent[] => { try { const v = JSON.parse(kv.getItem(OUTBOX_KEY) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
  const saveOutbox = (list: ActivityEvent[]) => { try { kv.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-OUTBOX_MAX))) } catch { /* فقط حافظه */ } }

  function sessionId(t: Date): string {
    try {
      const s = JSON.parse(kv.getItem(SESSION_KEY) ?? 'null') as { session_id: string; last_event_at: string } | null
      if (s && t.getTime() - Date.parse(s.last_event_at) < SESSION_GAP_MS) {
        kv.setItem(SESSION_KEY, JSON.stringify({ ...s, last_event_at: nowISO(t) }))
        return s.session_id
      }
    } catch { /* نشست تازه */ }
    const id = randomId('s')
    try { kv.setItem(SESSION_KEY, JSON.stringify({ session_id: id, last_event_at: nowISO(t) })) } catch { /* فقط حافظه */ }
    return id
  }

  /** ثبت رویداد؛ بدون رضایت «تحلیل» هیچ‌چیز ذخیره نمی‌شود. null یعنی ثبت نشد. */
  function track(type: EventType, props: EventProps = {}): ActivityEvent | null {
    if (!EVENT_TYPES.includes(type)) return null
    const c = consent()
    if (!c.analytics) return null
    const t = now()
    const clean = sanitizeProps(props)
    const key = type + JSON.stringify(clean)
    if (key === lastKey && t.getTime() - lastAt < DEDUPE_WINDOW_MS) return null // رویداد تکراری پشت‌سرهم (مثلاً رندر دوباره)
    lastKey = key; lastAt = t.getTime()
    const inst = installation()
    const ev: ActivityEvent = {
      event_id: randomId('e'), anonymous_id: inst.anonymous_id, ...(inst.user_id ? { user_id: inst.user_id } : {}),
      event_type: type, occurred_at: nowISO(t), session_id: sessionId(t), ...clean,
      app_version: deps.appVersion ?? APP_VERSION, platform: deps.platform ?? 'web', consent_context: c,
    }
    saveOutbox([...loadOutbox(), ev])
    emit()
    if (loadOutbox().length >= 20 && t.getTime() >= retryAt) void flush()
    return ev
  }

  async function flush(): Promise<FlushResult> {
    if (flushing) return { status: 'skipped', sent: 0 }
    const batch = loadOutbox()
    if (!batch.length) return { status: 'empty', sent: 0 }
    if (!consent().analytics) return { status: 'skipped', sent: 0 }
    flushing = true
    try {
      await transport.send(batch)
      const ids = new Set(batch.map((e) => e.event_id))
      saveOutbox(loadOutbox().filter((e) => !ids.has(e.event_id))) // فقط موارد ارسال‌شده حذف می‌شوند
      failures = 0; retryAt = 0; emit()
      return { status: 'sent', sent: batch.length }
    } catch (e) {
      failures += 1
      retryAt = now().getTime() + Math.min(3600_000, 30_000 * 2 ** failures) // عقب‌نشینی نمایی؛ داده‌ها حفظ می‌شوند
      return { status: 'failed', sent: 0, code: e instanceof BackendNotConnectedError ? 'BACKEND_NOT_CONNECTED' : 'NETWORK_ERROR' }
    } finally { flushing = false }
  }

  function setConsent(kind: ConsentKind, granted: boolean) {
    recordConsent(kv, installation().anonymous_id, kind, granted, now())
    if (kind === 'analytics' && !granted) kv.removeItem(OUTBOX_KEY) // لغو رضایت: صف ارسال‌نشده پاک می‌شود
    emit()
  }

  /** نسخهٔ قابل‌مشاهده از داده‌های همین دستگاه (حق مشاهده) */
  const exportMyData = () => ({ installation: installation(), consent: loadConsentRecords(kv), pending_events: loadOutbox() })

  /** درخواست حذف: داده‌های محلی پاک، رضایت‌ها لغو و یک درخواست حذف برای سرور (پس از اتصال) ثبت می‌شود. */
  function deleteMyData() {
    const id = installation().anonymous_id
    const req = { anonymous_id: id, requested_at: nowISO(now()), status: 'pending_server' as const }
    ;[OUTBOX_KEY, SESSION_KEY].forEach((k) => kv.removeItem(k))
    clearConsent(kv); clearInstallation(kv)
    try { kv.setItem(DELETION_KEY, JSON.stringify(req)) } catch { /* فقط حافظه */ }
    lastKey = ''
    emit()
    return req
  }
  const deletionRequest = () => { try { return JSON.parse(kv.getItem(DELETION_KEY) ?? 'null') as { anonymous_id: string; requested_at: string; status: string } | null } catch { return null } }

  return {
    track, flush, setConsent, consent, exportMyData, deleteMyData, deletionRequest,
    pending: () => loadOutbox().length, installation,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } },
    consentKinds: CONSENT_KINDS,
  }
}
export type Tracker = ReturnType<typeof createTracker>
