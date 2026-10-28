// وضعیت واقعی مجوزهای مرورگر/سیستم‌عامل. مبنای رضایت «اعلان» و «موقعیت» همین است:
// مجوز داده شده = رضایت؛ رد شده، پرسیده‌نشده یا برگشته به حالت پرسش = بدون رضایت.
// 'unknown' یعنی مرورگر پاسخ قابل‌اعتمادی نمی‌دهد (مثلاً Permissions API ندارد)؛ در این حالت هیچ رضایتی تغییر نمی‌کند و داده‌ای پاک نمی‌شود.
export type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown'

export interface PermissionReader {
  notifications(): Promise<PermState>
  location(): Promise<PermState>
}

const fromNotification = (): PermState => {
  if (typeof Notification === 'undefined') return 'unsupported'
  const p = Notification.permission
  return p === 'default' ? 'prompt' : p
}
const queryState = async (name: PermissionName): Promise<PermState> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'unknown'
    return (await navigator.permissions.query({ name })).state as PermState
  } catch { return 'unknown' }
}

export const browserPermissionReader: PermissionReader = {
  notifications: async () => fromNotification(),
  location: async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return 'unsupported'
    return queryState('geolocation')
  },
}

/** تغییر مجوز (از تنظیمات مرورگر) را بدون نیاز به بازکردن دوبارهٔ برنامه می‌شنود. مقدار برگشتی توقف است. */
export function watchPermissions(onChange: () => void): () => void {
  const stops: Array<() => void> = []
  const hook = (name: PermissionName) => {
    try {
      if (!navigator.permissions?.query) return
      void navigator.permissions.query({ name }).then((st) => { st.addEventListener('change', onChange); stops.push(() => st.removeEventListener('change', onChange)) }).catch(() => undefined)
    } catch { /* پشتیبانی نمی‌شود */ }
  }
  hook('geolocation'); hook('notifications' as PermissionName)
  const vis = () => { if (document.visibilityState === 'visible') onChange() }
  window.addEventListener('focus', onChange); document.addEventListener('visibilitychange', vis)
  stops.push(() => { window.removeEventListener('focus', onChange); document.removeEventListener('visibilitychange', vis) })
  return () => stops.forEach((f) => f())
}
