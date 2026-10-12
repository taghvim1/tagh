import { useMemo } from 'react'
import AppChrome from '../components/AppChrome'
import DestinationContent from '../components/DestinationContent'
import { fromGregorian } from '../lib/jalali'
import { useSelectedDate } from '../lib/selection'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'
import { findDestination } from '../travel/repository'
import { useAllDestinations } from '../travel/remote'
import { seasonOfMonth } from '../travel/season'

// مسیر مستقیم جزئیات (برای لینک‌های قدیمی/مستقیم)؛ محتوا همان پنجرهٔ جزئیات است.
export default function DestinationDetails({ id }: { id: number }) {
  const [dark] = useDarkMode()
  useThemeColorMeta(dark)
  const today = useMemo(() => fromGregorian(new Date()), [])
  const season = seasonOfMonth((useSelectedDate() ?? today).month)
  const d = findDestination(useAllDestinations(), id)
  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" backFallback="/travel-suggestions" />
      <main className="tp-main">
        {d && d.enabled ? <DestinationContent destination={d} season={season} /> : <header className="tp-head"><h1>مقصد پیدا نشد</h1><p className="tp-lead">این مقصد وجود ندارد.</p></header>}
      </main>
    </div>
  )
}
