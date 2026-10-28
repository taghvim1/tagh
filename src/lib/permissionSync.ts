import { tracker } from '../analytics'
import { browserPermissionReader, watchPermissions } from '../analytics/permissions'
import { weatherStore } from '../weather/current/store'

/** رضایت اعلان/موقعیت را با مجوز واقعی مرورگر هماهنگ نگه می‌دارد (هنگام شروع، بازگشت به برنامه و تغییر مجوز).
 *  اگر مجوز موقعیت برداشته شود، مختصات و آب‌وهوای ذخیره‌شده از دستگاه پاک می‌شود. مجوزِ «نامعلوم» هیچ‌چیز را تغییر نمی‌دهد. */
export function startPermissionSync(): () => void {
  let busy = false
  const run = async () => {
    if (busy) return
    busy = true
    try {
      const before = tracker.consent().location
      await tracker.syncPermissions()
      const revoked = before && !tracker.consent().location
      const denied = (await browserPermissionReader.location()) === 'denied'
      if ((revoked || denied) && weatherStore.getCoords()) weatherStore.clear()
    } finally { busy = false }
  }
  void run()
  const stopWatch = watchPermissions(() => void run())
  const stopStore = weatherStore.subscribe(() => void run()) // پس از اولین موفقیت GPS، رضایت موقعیت ثبت شود
  return () => { stopWatch(); stopStore() }
}
