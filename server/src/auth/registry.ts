import type { Store } from '../store/types.js'

// ثبت نصب‌ها و کاربران برای پنل مدیریت. هر «نصب برنامه» همان لحظهٔ اولین باز شدن مهمان ثبت می‌شود؛
// با ثبت‌نام با شماره همان ردیف به «ثبت‌نام‌شده» تبدیل و با تکمیل پروفایل کامل می‌شود. فقط یک مقدار KV (با قفل درون‌پردازشی).
export interface Person {
  id: string // مهمان: شناسهٔ نصب؛ ثبت‌نام‌شده: user_id
  anonymous_ids: string[]
  user_id?: string
  status: 'guest' | 'registered'
  state: 'active' | 'disabled'
  first_seen_at: string
  last_seen_at: string
  registered_at?: string
  platform: 'web' | 'pwa'
  app_version: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  email?: string
  profile_complete: boolean
  profile_updated_at?: string
  /** تعداد دفعات باز شدن برنامه و تعداد نشست‌ها (بازشدن با فاصلهٔ بیش از ۳۰ دقیقه از آخرین مراجعه) */
  opens?: number
  sessions?: number
  log?: { at: string; type: 'first_open' | 'open' | 'register' | 'login' | 'profile' }[]
}
export interface ProfileInput { first_name: string; last_name: string; city: string; email?: string }
export const isComplete = (p: { first_name?: string; last_name?: string; city?: string }) => !!(p.first_name?.trim() && p.last_name?.trim() && p.city?.trim())

const KEY = 'people:v1', MAX_PEOPLE = 200_000, SESSION_GAP = 30 * 60_000, MAX_LOG = 40
type LogType = NonNullable<Person['log']>[number]['type']
const note = (p: Person, type: LogType, at: string) => { p.log = [...(p.log ?? []), { at, type }].slice(-MAX_LOG) }

export function createRegistry(d: { store: Store; now?: () => number }) {
  const { store } = d, now = d.now ?? (() => Date.now())
  const iso = () => new Date(now()).toISOString()
  const load = async (): Promise<Person[]> => { try { const v = JSON.parse((await store.getKV(KEY)) ?? '[]'); return Array.isArray(v) ? v as Person[] : [] } catch { return [] } }
  let chain: Promise<unknown> = Promise.resolve()
  function tx<T>(fn: (people: Person[]) => T): Promise<T> {
    const run = chain.then(async () => { const people = await load(); const r = fn(people); await store.setKV(KEY, JSON.stringify(people)); return r })
    chain = run.catch(() => undefined)
    return run
  }
  const byAnon = (ps: Person[], a: string) => ps.find((p) => p.anonymous_ids.includes(a))

  return {
    all: load,
    get: async (id: string) => (await load()).find((p) => p.id === id) ?? null,
    /** هر بار برنامه باز می‌شود: نصب تازه = مهمان جدید؛ نصب قبلی فقط «آخرین مراجعه» را به‌روز می‌کند. */
    touchInstall(anon: string, platform: 'web' | 'pwa', appVersion: string) {
      return tx((ps) => {
        const t = iso(), cur = byAnon(ps, anon)
        if (cur) {
          cur.opens = (cur.opens ?? 0) + 1
          if (Date.parse(t) - Date.parse(cur.last_seen_at) > SESSION_GAP || !cur.sessions) { cur.sessions = (cur.sessions ?? 0) + 1; note(cur, 'open', t) }
          cur.last_seen_at = t; cur.platform = platform; cur.app_version = appVersion; return { created: false }
        }
        if (ps.length >= MAX_PEOPLE) return { created: false }
        ps.push({ id: anon, anonymous_ids: [anon], status: 'guest', state: 'active', first_seen_at: t, last_seen_at: t, platform, app_version: appVersion, profile_complete: false, opens: 1, sessions: 1, log: [{ at: t, type: 'first_open' }] })
        return { created: true }
      })
    },
    /** ثبت‌نام/ورود با شماره: ردیف مهمانِ همان نصب به حساب تبدیل می‌شود (یا ردیف حساب ساخته/به‌روز می‌شود). */
    linkUser(u: { user_id: string; phone: string; installation_id?: string; profile?: Partial<ProfileInput> | null; platform?: 'web' | 'pwa'; app_version?: string }) {
      return tx((ps) => {
        const t = iso()
        let acct = ps.find((p) => p.user_id === u.user_id)
        const guest = u.installation_id ? byAnon(ps, u.installation_id) : undefined
        if (!acct && guest && !guest.user_id) { acct = guest; acct.id = u.user_id }
        else if (acct && guest && guest !== acct && !guest.user_id) { // ادغام ردیف مهمانِ همین نصب در حساب
          acct.anonymous_ids = [...new Set([...acct.anonymous_ids, ...guest.anonymous_ids])]
          acct.first_seen_at = acct.first_seen_at < guest.first_seen_at ? acct.first_seen_at : guest.first_seen_at
          ps.splice(ps.indexOf(guest), 1)
        }
        if (!acct) {
          if (ps.length >= MAX_PEOPLE) return null
          acct = { id: u.user_id, anonymous_ids: [], status: 'registered', state: 'active', first_seen_at: t, last_seen_at: t, platform: u.platform ?? 'web', app_version: u.app_version ?? '', profile_complete: false }
          ps.push(acct)
        }
        note(acct, acct.registered_at ? 'login' : 'register', t)
        acct.user_id = u.user_id; acct.status = 'registered'; acct.phone = u.phone; acct.last_seen_at = t; acct.registered_at ??= t
        if (u.installation_id && !acct.anonymous_ids.includes(u.installation_id)) acct.anonymous_ids = [...acct.anonymous_ids, u.installation_id].slice(-20)
        if (u.profile) Object.assign(acct, { first_name: u.profile.first_name, last_name: u.profile.last_name, city: u.profile.city, email: u.profile.email })
        acct.profile_complete = isComplete(acct)
        return { ...acct }
      })
    },
    setProfile(userId: string, p: ProfileInput) {
      return tx((ps) => {
        const acct = ps.find((x) => x.user_id === userId); if (!acct) return null
        Object.assign(acct, { first_name: p.first_name, last_name: p.last_name, city: p.city, email: p.email || undefined, profile_updated_at: iso() })
        acct.profile_complete = isComplete(acct); note(acct, 'profile', iso())
        return { ...acct }
      })
    },
    setState(id: string, state: 'active' | 'disabled') { return tx((ps) => { const p = ps.find((x) => x.id === id); if (!p) return false; p.state = state; return true }) },
    remove(id: string) { return tx((ps) => { const i = ps.findIndex((x) => x.id === id || x.user_id === id); if (i < 0) return false; ps.splice(i, 1); return true }) },
    isDisabled: async (userId: string) => (await load()).some((p) => p.user_id === userId && p.state === 'disabled'),
  }
}
export type Registry = ReturnType<typeof createRegistry>
