import { nowISO } from './ids'
import type { AccountMergeLog, ActivityEvent, AnonymousInstallation, UserPreferences } from './types'

/** حالت سمت سرور برای یک حساب؛ ادغام باید روی سرور و داخل یک تراکنش انجام شود. این تابع منطق خالص آن است. */
export interface AccountState {
  user_id: string
  events: ActivityEvent[]
  preferences: UserPreferences
  /** installationهایی که قبلاً به این حساب وصل شده‌اند */
  linked_installations: string[]
  merge_logs: AccountMergeLog[]
}
export interface GuestBundle { installation: AnonymousInstallation; events: ActivityEvent[]; preferences: UserPreferences }
export interface MergeInput {
  account: AccountState
  guest: GuestBundle
  /** نتیجهٔ احراز هویت واقعی سمت سرور (نه ادعای کلاینت) */
  authVerified: boolean
  /** installationهایی که هم‌اکنون به حساب دیگری وصل‌اند (فهرست سمت سرور) */
  installationOwners: Record<string, string>
  now?: Date
  newId?: () => string
}
export interface MergeResult { account: AccountState; guest: GuestBundle; log: AccountMergeLog }

const uniq = <T,>(a: T[]) => Array.from(new Set(a))

/**
 * ادغام مهمان در حساب:
 *  - فقط پس از احراز هویت؛ هرگز بر اساس شباهت نام/شهر/IP/دستگاه.
 *  - اتمیک: یا همهٔ تغییرات یا هیچ (در خطا ورودی دست‌نخورده برمی‌گردد و سوابق حذف نمی‌شوند).
 *  - تکرارپذیر: اجرای دوباره چیزی اضافه نمی‌کند (dedupe بر اساس event_id).
 *  - علاقه‌مندی‌ها و ترجیحات صریح حساب بازنویسی نمی‌شوند. رکوردهای مهمان پس از ادغام حذف نمی‌شوند.
 */
export function mergeGuestIntoAccount(i: MergeInput): MergeResult {
  try { return mergeInner(i) } catch {
    // ورودی خراب یا خطای غیرمنتظره: هیچ دادهٔ مهمان یا حسابی تغییر/حذف نمی‌شود و تلاش مجدد امن است
    const at = nowISO(i.now ?? new Date())
    const log: AccountMergeLog = { merge_id: `${i.account?.user_id}:${i.guest?.installation?.anonymous_id}:failed:${at}`, user_id: i.account?.user_id, anonymous_id: i.guest?.installation?.anonymous_id, status: 'failed', reason_code: 'MERGE_EXCEPTION', events_linked: 0, events_skipped_duplicates: 0, favorites_added: 0, created_at: at }
    return { account: i.account, guest: i.guest, log }
  }
}

function mergeInner(i: MergeInput): MergeResult {
  const now = nowISO(i.now ?? new Date())
  const anon = i.guest.installation.anonymous_id
  const mk = (status: AccountMergeLog['status'], p: Partial<AccountMergeLog> = {}): AccountMergeLog => ({
    merge_id: i.newId ? i.newId() : `${i.account.user_id}:${anon}:${status}:${now}`, user_id: i.account.user_id, anonymous_id: anon, status,
    events_linked: 0, events_skipped_duplicates: 0, favorites_added: 0, created_at: now, ...p })
  const reject = (reason_code: string): MergeResult => ({ account: { ...i.account, merge_logs: [...i.account.merge_logs, mk('rejected', { reason_code })] }, guest: i.guest, log: mk('rejected', { reason_code }) })

  if (!i.authVerified) return reject('AUTH_REQUIRED')
  if (!anon || !i.account.user_id) return reject('INVALID_IDENTITY')
  const owner = i.installationOwners[anon] ?? i.guest.installation.user_id
  if (owner && owner !== i.account.user_id) return reject('INSTALLATION_OWNED_BY_OTHER_ACCOUNT')
  if (i.guest.events.some((e) => e.anonymous_id !== anon)) return reject('FOREIGN_EVENTS_IN_BUNDLE') // رویداد متعلق به شناسهٔ دیگر
  if (i.account.linked_installations.includes(anon) && i.account.merge_logs.some((l) => l.anonymous_id === anon && l.status === 'success'))
    return alreadyMerged(i, mk)

  try {
    const known = new Set(i.account.events.map((e) => e.event_id))
    const fresh: ActivityEvent[] = []
    let dup = 0
    for (const e of i.guest.events) { if (known.has(e.event_id)) dup++; else { known.add(e.event_id); fresh.push({ ...e, user_id: i.account.user_id }) } }
    const ap = i.account.preferences, gp = i.guest.preferences
    const favD = uniq([...ap.favorites.destination, ...gp.favorites.destination])
    const favT = uniq([...ap.favorites.tour, ...gp.favorites.tour])
    const added = favD.length - ap.favorites.destination.length + (favT.length - ap.favorites.tour.length)
    const hidden = uniq([...ap.hidden_interests, ...gp.hidden_interests])
    const preferences: UserPreferences = { ...ap, favorites: { destination: favD, tour: favT },
      explicit_interests: uniq([...ap.explicit_interests, ...gp.explicit_interests]).filter((k) => !ap.hidden_interests.includes(k)), hidden_interests: hidden, updated_at: now }
    const log = mk('success', { events_linked: fresh.length, events_skipped_duplicates: dup, favorites_added: added })
    return {
      account: { ...i.account, events: [...i.account.events, ...fresh], preferences, linked_installations: uniq([...i.account.linked_installations, anon]), merge_logs: [...i.account.merge_logs, log] },
      guest: { ...i.guest, installation: { ...i.guest.installation, user_id: i.account.user_id, account_status: 'registered', updated_at: now } }, // سوابق مهمان حفظ می‌شوند
      log,
    }
  } catch {
    const log = mk('failed', { reason_code: 'MERGE_EXCEPTION' })
    return { account: { ...i.account, merge_logs: [...i.account.merge_logs, log] }, guest: i.guest, log } // داده‌ای حذف نشده؛ تلاش مجدد امن است
  }
}

function alreadyMerged(i: MergeInput, mk: (s: AccountMergeLog['status'], p?: Partial<AccountMergeLog>) => AccountMergeLog): MergeResult {
  // رویدادهای مهمانِ ثبت‌شده پس از ادغام قبلی (در صورت وجود) می‌توانند بدون تکرار اضافه شوند؛ اینجا دقیقاً همان منطق dedupe اجرا می‌شود.
  const known = new Set(i.account.events.map((e) => e.event_id))
  const fresh = i.guest.events.filter((e) => !known.has(e.event_id)).map((e) => ({ ...e, user_id: i.account.user_id }))
  const log = mk('already_merged', { events_linked: fresh.length, events_skipped_duplicates: i.guest.events.length - fresh.length })
  return { account: { ...i.account, events: [...i.account.events, ...fresh], merge_logs: [...i.account.merge_logs, log] }, guest: i.guest, log }
}
