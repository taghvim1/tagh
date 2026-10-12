import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { Config } from './config.js'
import type { Store } from './store/types.js'

export const SECRET_NAMES = ['gemini', 'brave', 'pexels'] as const
export type SecretName = (typeof SECRET_NAMES)[number]
const ENV_VAR: Record<SecretName, keyof Config> = { gemini: 'GEMINI_API_KEY', brave: 'BRAVE_SEARCH_API_KEY', pexels: 'PEXELS_API_KEY' }
export const envVarOf = (n: SecretName) => ENV_VAR[n] as string
const kvKey = (n: SecretName) => `secret:${n}`

const keyBytes = (k: string) => createHash('sha256').update(k).digest()
export function encrypt(plain: string, secret: string): string {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', keyBytes(secret), iv)
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.')
}
export function decrypt(blob: string, secret: string): string | null {
  try {
    const [iv, tag, enc] = blob.split('.').map((x) => Buffer.from(x, 'base64'))
    const d = createDecipheriv('aes-256-gcm', keyBytes(secret), iv); d.setAuthTag(tag)
    return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
  } catch { return null }
}
export const mask = (v: string) => `••••${v.slice(-4)}`

export interface SecretStatus { configured: boolean; source: 'env' | 'ui' | null; masked: string | null; env_var: string; ui_storage: 'available' | 'needs_encryption_key' | 'blocked_in_production_without_admin_token' }

/** کلیدها فقط روی سرور می‌مانند؛ هیچ مسیری مقدار کامل را برنمی‌گرداند. اولویت: متغیر محیطی، سپس مقدار رمزنگاری‌شدهٔ واردشده از رابط. */
export function createSecrets(config: Config, store: Store) {
  const uiWritable = (): SecretStatus['ui_storage'] => {
    if (!config.SECRETS_ENCRYPTION_KEY) return 'needs_encryption_key'
    if (config.NODE_ENV === 'production' && !config.ADMIN_TOKEN) return 'blocked_in_production_without_admin_token'
    return 'available'
  }
  async function get(n: SecretName): Promise<{ value: string; source: 'env' | 'ui' } | null> {
    const env = config[ENV_VAR[n]] as string | undefined
    if (env) return { value: env, source: 'env' }
    const blob = await store.getKV(kvKey(n))
    if (blob && config.SECRETS_ENCRYPTION_KEY) { const v = decrypt(blob, config.SECRETS_ENCRYPTION_KEY); if (v) return { value: v, source: 'ui' } }
    return null
  }
  return {
    get,
    async status(n: SecretName): Promise<SecretStatus> {
      const s = await get(n)
      return { configured: !!s, source: s?.source ?? null, masked: s ? mask(s.value) : null, env_var: envVarOf(n), ui_storage: uiWritable() }
    },
    async set(n: SecretName, value: string) {
      const w = uiWritable()
      if (w !== 'available') return { ok: false as const, reason: w }
      await store.setKV(kvKey(n), encrypt(value.trim(), config.SECRETS_ENCRYPTION_KEY!)); return { ok: true as const }
    },
    remove: (n: SecretName) => store.deleteKV(kvKey(n)),
  }
}
export type Secrets = ReturnType<typeof createSecrets>
