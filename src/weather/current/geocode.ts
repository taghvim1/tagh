// نام شهر از روی مختصات (Reverse Geocoding) با سرویس BigDataCloud «reverse-geocode-client» (بدون کلید، مخصوص استفادهٔ سمت کاربر).
// مختصات قبل از ارسال به ۲ رقم اعشار (حدود ۱ کیلومتر) گرد می‌شود و نتیجه روی همین دستگاه کش می‌شود.
const ENDPOINT = 'https://api.bigdatacloud.net/data/reverse-geocode-client'
const CACHE_KEY = 'taghvim-geocache'
const MAX = 20

export const roundCoord = (n: number) => Math.round(n * 100) / 100
const keyOf = (lat: number, lon: number) => `${lat},${lon}`

const read = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') } catch { return {} } }

export function buildGeocodeUrl(lat: number, lon: number): string {
  return `${ENDPOINT}?${new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'fa' })}`
}

/** نام شهر یا null (حدس زده نمی‌شود) */
export async function reverseGeocode(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const [la, lo] = [roundCoord(lat), roundCoord(lon)]
  const cache = read()
  if (cache[keyOf(la, lo)]) return cache[keyOf(la, lo)]
  try {
    const res = await fetchImpl(buildGeocodeUrl(la, lo), { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return null
    const j = (await res.json()) as { city?: unknown; locality?: unknown }
    const name = [j.city, j.locality].find((x): x is string => typeof x === 'string' && x.trim() !== '')?.trim()
    if (!name) return null
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries([...Object.entries(cache), [keyOf(la, lo), name]].slice(-MAX)))) } catch { /* فقط حافظه */ }
    return name
  } catch { return null }
}
