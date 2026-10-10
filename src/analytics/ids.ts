// شناسه‌های تصادفی و غیرقابل‌حدس (CSPRNG). هیچ مشخصهٔ سخت‌افزاری یا اثرانگشتی استفاده نمی‌شود.
export function randomId(prefix = ''): string {
  const c = globalThis.crypto
  let id: string
  if (c?.randomUUID) id = c.randomUUID()
  else {
    const b = new Uint8Array(16)
    c.getRandomValues(b)
    id = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  }
  return prefix ? `${prefix}_${id}` : id
}
export const nowISO = (d: Date = new Date()) => d.toISOString()

/** حافظهٔ کلید-مقدار (localStorage یا نمونهٔ تست) */
export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export const memoryKV = (): KV => {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}
export function safeKV(): KV {
  try { localStorage.getItem('x'); return localStorage } catch { return memoryKV() }
}
