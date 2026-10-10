import { nowISO, randomId, type KV } from './ids'
import type { AnonymousInstallation } from './types'
import { NO_CONSENT } from './consent'

export const APP_VERSION = '1.0.0'
const KEY = 'taghvim-installation-v1'

/** شناسهٔ ناشناس نصب: در اولین اجرا ساخته می‌شود و در اجراهای بعدی ثابت می‌ماند. */
export function getOrCreateInstallation(kv: KV, now = new Date(), platform: 'web' | 'pwa' = 'web'): AnonymousInstallation {
  try {
    const cur = JSON.parse(kv.getItem(KEY) ?? 'null') as AnonymousInstallation | null
    if (cur?.anonymous_id) {
      const upd = { ...cur, last_seen_at: nowISO(now), updated_at: nowISO(now), platform }
      kv.setItem(KEY, JSON.stringify(upd))
      return upd
    }
  } catch { /* خراب؛ دوباره ساخته می‌شود */ }
  const t = nowISO(now)
  const inst: AnonymousInstallation = {
    anonymous_id: randomId('anon'), account_status: 'guest', first_seen_at: t, last_seen_at: t, created_at: t, updated_at: t,
    app_version: APP_VERSION, platform, consent_status: { ...NO_CONSENT },
  }
  try { kv.setItem(KEY, JSON.stringify(inst)) } catch { /* فقط حافظه */ }
  return inst
}
export const clearInstallation = (kv: KV) => kv.removeItem(KEY)
