// وضعیت آب‌وهوای فعلی کاربر: دریافت موقعیت با اقدام کاربر، دریافت آب‌وهوا، نام شهر و به‌روزرسانی دوره‌ای.
// همهٔ وابستگی‌های محیطی (GPS، شبکه، زمان، ذخیره‌سازی) تزریق‌پذیرند تا تست‌پذیر باشد؛ موقعیت فقط روی همین دستگاه ذخیره می‌شود.
import { useSyncExternalStore } from 'react'
import { WeatherError } from '../codes'
import { fetchForecast } from './client'
import { reverseGeocode, roundCoord } from './geocode'
import type { CurrentWeather, CurrentWeatherError } from './types'

export const REFRESH_MS = 30 * 60_000
const MIN_AUTO_GAP_MS = 60_000
const STORAGE_KEY = 'taghvim-current-weather'

export interface WeatherState {
  /** idle = هنوز اجازه/اقدامی از کاربر نیست؛ ready با error = آخرین داده نمایش داده می‌شود ولی به‌روزرسانی ناموفق بود */
  status: 'idle' | 'locating' | 'loading' | 'ready' | 'error'
  weather: CurrentWeather | null
  city: string | null
  updatedAt: number | null
  error: CurrentWeatherError | null
}

interface Persisted { coords: { lat: number; lon: number }; city: string | null; weather: CurrentWeather | null; updatedAt: number | null }
type Coords = { lat: number; lon: number }

export interface WeatherDeps {
  getPosition: (opts: { silent: boolean }) => Promise<Coords>
  permission: () => Promise<'granted' | 'denied' | 'prompt' | 'unknown'>
  fetchForecast: (lat: number, lon: number) => Promise<CurrentWeather>
  reverseGeocode: (lat: number, lon: number) => Promise<string | null>
  now: () => number
  online: () => boolean
  load: () => Persisted | null
  save: (p: Persisted | null) => void
}

const POS_ERR: Record<number, CurrentWeatherError> = { 1: 'denied', 2: 'unavailable', 3: 'timeout' }

export const browserDeps: WeatherDeps = {
  getPosition: () => new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(Object.assign(new Error('unsupported'), { kind: 'unsupported' }))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: roundCoord(p.coords.latitude), lon: roundCoord(p.coords.longitude) }),
      (e) => reject(Object.assign(new Error(e.message), { kind: POS_ERR[e.code] ?? 'unavailable' })),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    )
  }),
  permission: async () => {
    try { return (await navigator.permissions.query({ name: 'geolocation' })).state } catch { return 'unknown' }
  },
  fetchForecast: (la, lo) => fetchForecast(la, lo),
  reverseGeocode: (la, lo) => reverseGeocode(la, lo),
  now: () => Date.now(),
  online: () => navigator.onLine !== false,
  load: () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') } catch { return null } },
  save: (p) => { try { p ? localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) : localStorage.removeItem(STORAGE_KEY) } catch { /* فقط حافظه */ } },
}

export function createWeatherStore(deps: WeatherDeps = browserDeps) {
  const saved = deps.load()
  let coords: Coords | null = saved?.coords ?? null
  let state: WeatherState = saved && coords
    ? { status: saved.weather ? 'ready' : 'idle', weather: saved.weather, city: saved.city, updatedAt: saved.updatedAt, error: null }
    : { status: 'idle', weather: null, city: null, updatedAt: null, error: null }
  const listeners = new Set<() => void>()
  let inFlight = false
  let lastAttempt = 0

  const set = (patch: Partial<WeatherState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
  const persist = () => { if (coords) deps.save({ coords, city: state.city, weather: state.weather, updatedAt: state.updatedAt }) }
  const failure = (kind: CurrentWeatherError) => set(state.weather ? { status: 'ready', error: kind } : { status: 'error', error: kind })

  async function fetchFor(c: Coords) {
    if (!deps.online()) return failure('network')
    set({ status: state.weather ? 'ready' : 'loading', error: null })
    try {
      const weather = await deps.fetchForecast(c.lat, c.lon)
      const city = await deps.reverseGeocode(c.lat, c.lon)
      set({ status: 'ready', weather, city, updatedAt: deps.now(), error: null })
      persist()
    } catch (e) {
      failure(e instanceof WeatherError && e.kind === 'network' ? 'network' : 'api')
    }
  }

  /** reposition: موقعیت جدید از GPS؛ silent = بدون نمایش درخواست مجوز (فقط وقتی مجوز قبلاً داده شده) */
  async function run(opts: { reposition: boolean; silent: boolean }) {
    if (inFlight) return
    inFlight = true
    lastAttempt = deps.now()
    try {
      if (opts.reposition || !coords) {
        if (!state.weather) set({ status: 'locating', error: null })
        try { coords = await deps.getPosition({ silent: opts.silent }) } catch (e) {
          const kind = (e as { kind?: CurrentWeatherError }).kind ?? 'unavailable'
          // موقعیت جدید ممکن نشد ولی مختصات قبلی هست: با همان ادامه می‌دهیم، فقط برای خطای مجوز گزارش می‌دهیم
          if (!coords || kind === 'denied') return failure(kind)
        }
      }
      if (coords) await fetchFor(coords)
    } finally { inFlight = false }
  }

  return {
    getState: () => state,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } },
    /** اقدام صریح کاربر (دکمه): درخواست مجوز موقعیت */
    request: () => run({ reposition: true, silent: false }),
    /** تلاش مجدد پس از خطا */
    retry: () => run({ reposition: !state.weather || state.error === 'denied' || state.error === 'unavailable' || state.error === 'timeout', silent: false }),
    clear: () => { coords = null; deps.save(null); state = { status: 'idle', weather: null, city: null, updatedAt: null, error: null }; listeners.forEach((l) => l()) },
    /** شروع به‌روزرسانی خودکار؛ تا وقتی کاربر موقعیت را فعال نکرده (مختصاتی نیست) هیچ درخواستی نمی‌فرستد. مقدار برگشتی توقف است */
    start(): () => void {
      const stale = () => state.updatedAt === null || deps.now() - state.updatedAt >= REFRESH_MS
      const auto = async () => {
        if (!coords || inFlight || deps.now() - lastAttempt < MIN_AUTO_GAP_MS) return
        // موقعیت جدید فقط وقتی مجوز از قبل داده شده (بدون پنجرهٔ ناخواستهٔ مجوز)
        await run({ reposition: (await deps.permission()) === 'granted', silent: true })
      }
      if (coords && stale()) void auto()
      const timer = setInterval(() => { if (typeof document === 'undefined' || document.visibilityState === 'visible') void auto() }, REFRESH_MS)
      const onVisible = () => { if (document.visibilityState === 'visible' && stale()) void auto() }
      const onOnline = () => { if (stale() || state.error) void auto() }
      document.addEventListener?.('visibilitychange', onVisible)
      window.addEventListener?.('online', onOnline)
      return () => { clearInterval(timer); document.removeEventListener?.('visibilitychange', onVisible); window.removeEventListener?.('online', onOnline) }
    },
  }
}

export const weatherStore = createWeatherStore()
export const useCurrentWeather = () => useSyncExternalStore(weatherStore.subscribe, weatherStore.getState, weatherStore.getState)
