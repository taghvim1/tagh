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
  /** اشتراک Web Push برای پیشنهادهای تبلیغاتی (فقط با مجوز اعلان + رضایت تبلیغاتی ثبت می‌شود) و آخرین ارسال تبلیغاتی (برای سقف تکرار) */
  push?: { endpoint: string; p256dh: string; auth: string; at: string }
  promo_last_sent_at?: string
  promo_unsubscribed_at?: string
}
export interface ProfileInput { first_name: string; last_name: string; city: string; email?: string }
/** مهمانِ بی‌فعالیت: ثبت‌نام نکرده، حداکثر یک‌بار باز شده و بعد از cutoff برنگشته */
export const isStaleGuest = (p: Person, cutoffMs: number) => p.status === 'guest' && !p.user_id && (p.opens ?? 1) <= 1 && Date.parse(p.last_seen_at) < cutoffMs
export const isComplete = (p: { first_name?: string; last_name?: string; city?: string }) => !!(p.first_name?.trim() && p.last_name?.trim() && p.city?.trim())

const KEY = 'people:v1', MAX_PEOPLE = 200_000, SESSION_GAP = 30 * 60_000, MAX_LOG = 40
export const MAX_NEW_GUESTS_PER_HOUR = 3000 // سقف ساخت مهمان تازه در هر ساعت (محافظ در برابر پرشدن جدول با ربات/اسکریپت)
export const STALE_GUEST_DAYS = 3 // مهمانِ «یک‌بار-بازشده» که این‌قدر روز برنگشته، بی‌فعالیت حساب می‌شود
type LogType = NonNullable<Person['log']>[number]['type']
const note = (p: Person, type: LogType, at: string) => { p.log = [...(p.log ?? []), { at, type }].slice(-MAX_LOG) }

export function createRegistry(d: { store: Store; now?: () => number; maxNewPerHour?: number }) {
  const { store } = d, now = d.now ?? (() => Date.now()), maxNewPerHour = d.maxNewPerHour ?? MAX_NEW_GUESTS_PER_HOUR
  const created: number[] = [] // زمان ساخت مهمان‌های تازهٔ یک ساعت اخیر
  const iso = () => new Date(now()).toISOString()
  // کل فهرست یک‌بار از KV خوانده و در حافظه نگه داشته می‌شود؛ نوشتن روی دیسک/DB دسته‌ای است (حداکثر هر ۵ ثانیه یک بار)
  // نه برای هر درخواست. فرض: یک نمونهٔ سرور. برای چند نمونه یا بیش از ~۵۰ هزار کاربر باید جدول واقعی در Postgres باشد.
  const FLUSH_MS = 5000
  let cache: Person[] | null = null, dirty = false, timer: ReturnType<typeof setTimeout> | null = null
  const load = async (): Promise<Person[]> => {
    if (cache) return cache
    try { const v = JSON.parse((await store.getKV(KEY)) ?? '[]'); cache = Array.isArray(v) ? v as Person[] : [] } catch { cache = [] }
    return cache
  }
  async function flush() {
    if (timer) { clearTimeout(timer); timer = null }
    if (!dirty || !cache) return
    dirty = false
    try { await store.setKV(KEY, JSON.stringify(cache)) } catch { dirty = true; schedule() }
  }
  function schedule() { if (!timer) { timer = setTimeout(() => { timer = null; void flush() }, FLUSH_MS); timer.unref?.() } }
  let chain: Promise<unknown> = Promise.resolve()
  function tx<T>(fn: (people: Person[]) => T): Promise<T> {
    const run = chain.then(async () => { const people = await load(); const r = fn(people); dirty = true; schedule(); return r })
    chain = run.catch(() => undefined)
    return run
  }
  const byAnon = (ps: Person[], a: string) => ps.find((p) => p.anonymous_ids.includes(a))

  return {
    all: async () => [...(await load())],
    /** نوشتن فوری تغییرات معلق (هنگام خاموش‌شدن سرور) */
    flush,
    get: async (id: string) => (await load()).find((p) => p.id === id) ?? null,
    /** هر بار برنامه باز می‌شود: نصب تازه = مهمان جدید؛ نصب قبلی فقط «آخرین مراجعه» را به‌روز می‌کند. */
    touchInstall(anon: string, platform: 'web' | 'pwa', appVersion: string, analyticsId?: string) {
      return tx((ps) => {
        const t = iso(), cur = byAnon(ps, anon)
        // شناسهٔ ردیاب (رویدادها/رضایت‌ها) به همین نصب وصل می‌شود تا علایق و رضایت در پنل دیده شود؛ شناسهٔ متعلق به شخص دیگر هرگز برداشته نمی‌شود
        const linkAnalytics = (p: Person) => { if (analyticsId && !p.anonymous_ids.includes(analyticsId) && !byAnon(ps, analyticsId)) p.anonymous_ids = [...p.anonymous_ids, analyticsId].slice(-20) }
        if (cur) {
          cur.opens = (cur.opens ?? 0) + 1
          if (Date.parse(t) - Date.parse(cur.last_seen_at) > SESSION_GAP || !cur.sessions) { cur.sessions = (cur.sessions ?? 0) + 1; note(cur, 'open', t) }
          cur.last_seen_at = t; cur.platform = platform; cur.app_version = appVersion; linkAnalytics(cur); return { created: false, throttled: false }
        }
        const nowMs = now()
        while (created.length && nowMs - created[0] > 3600_000) created.shift()
        if (created.length >= maxNewPerHour) return { created: false, throttled: true }
        if (ps.length >= MAX_PEOPLE) { const cut = nowMs - STALE_GUEST_DAYS * 86_400_000; for (let i = ps.length - 1; i >= 0; i--) if (isStaleGuest(ps[i], cut)) ps.splice(i, 1) }
        if (ps.length >= MAX_PEOPLE) return { created: false, throttled: true }
        const fresh: Person = { id: anon, anonymous_ids: [anon], status: 'guest', state: 'active', first_seen_at: t, last_seen_at: t, platform, app_version: appVersion, profile_complete: false, opens: 1, sessions: 1, log: [{ at: t, type: 'first_open' }] }
        ps.push(fresh); linkAnalytics(fresh); created.push(nowMs)
        return { created: true, throttled: false }
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
    /** ذخیرهٔ اشتراک Web Push (null = حذف). شناسه می‌تواند هر یک از شناسه‌های نصب شخص باشد. */
    setPush(anon: string, sub: { endpoint: string; p256dh: string; auth: string } | null) {
      return tx((ps) => {
        const p = byAnon(ps, anon) ?? ps.find((x) => x.id === anon); if (!p) return false
        if (sub) { p.push = { ...sub, at: iso() }; delete p.promo_unsubscribed_at } else { delete p.push; p.promo_unsubscribed_at = iso() }
        return true
      })
    },
    clearPushByEndpoint: (endpoint: string) => tx((ps) => { let n = 0; for (const p of ps) if (p.push?.endpoint === endpoint) { delete p.push; n++ } return n }),
    markPromoSent: (ids: string[], at: string) => tx((ps) => { const s = new Set(ids); for (const p of ps) if (s.has(p.id)) p.promo_last_sent_at = at }),
    /** حذف مهمان‌های بی‌فعالیت؛ فهرست حذف‌شده‌ها را برمی‌گرداند تا رویداد/رضایت‌شان هم پاک شود */
    purgeStaleGuests: (olderThanDays: number) => tx((ps) => {
      const cut = now() - olderThanDays * 86_400_000, gone: Person[] = []
      for (let i = ps.length - 1; i >= 0; i--) if (isStaleGuest(ps[i], cut)) gone.push(...ps.splice(i, 1))
      return gone
    }),
    isDisabled: async (userId: string) => (await load()).some((p) => p.user_id === userId && p.state === 'disabled'),
  }
}
export type Registry = ReturnType<typeof createRegistry>
