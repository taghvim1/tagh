import webpush from 'web-push'
import type { Config } from '../config.js'
import { decrypt, encrypt } from '../secrets.js'
import type { Store } from '../store/types.js'

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
export interface Pusher { publicKey(): Promise<string>; send(sub: PushSub, payload: { title: string; body: string; url: string; tag?: string }): Promise<boolean> }

/** Web Push (برای اعلان وقتی برنامه بسته است). کلیدهای VAPID یک‌بار ساخته و روی سرور نگه داشته می‌شوند. */
export function createPusher(d: { store: Store; config: Config }): Pusher {
  const { store, config } = d
  let keys: Promise<{ publicKey: string; privateKey: string }> | null = null
  const load = () => keys ??= (async () => {
    if (config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) return { publicKey: config.VAPID_PUBLIC_KEY, privateKey: config.VAPID_PRIVATE_KEY }
    const raw = await store.getKV('push:vapid')
    if (raw) {
      try { const p = JSON.parse(raw) as { publicKey: string; privateKey?: string; enc?: string }; const priv = p.enc && config.SECRETS_ENCRYPTION_KEY ? decrypt(p.enc, config.SECRETS_ENCRYPTION_KEY) : p.privateKey; if (p.publicKey && priv) return { publicKey: p.publicKey, privateKey: priv } } catch { /* بازسازی */ }
    }
    const k = webpush.generateVAPIDKeys()
    await store.setKV('push:vapid', JSON.stringify(config.SECRETS_ENCRYPTION_KEY ? { publicKey: k.publicKey, enc: encrypt(k.privateKey, config.SECRETS_ENCRYPTION_KEY) } : k))
    return k
  })()
  return {
    publicKey: async () => (await load()).publicKey,
    async send(sub, payload) {
      try {
        const k = await load()
        await webpush.sendNotification(sub, JSON.stringify(payload), { vapidDetails: { subject: config.VAPID_SUBJECT ?? 'mailto:admin@example.com', publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 3600, timeout: 10_000 })
        return true
      } catch { return false }
    },
  }
}
