/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, lazy, useEffect, useState, type ComponentType, type ReactNode } from 'react'

/** import پویا با یک تلاش مجدد؛ خطای نهایی به ErrorBoundary می‌رسد (نه صفحهٔ سفید). */
export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() => factory().catch(() => new Promise<{ default: T }>((res, rej) => setTimeout(() => factory().then(res, rej), 800))))
}

const box = { padding: 24, textAlign: 'center', lineHeight: 2, fontFamily: 'inherit' } as const
const reload = () => window.location.reload()

/** نمایش وضعیت بارگذاری؛ اگر از ۱۰ ثانیه بیشتر طول بکشد پیام و دکمهٔ تلاش مجدد نشان می‌دهد. */
export function SlowLoading({ label = 'در حال بارگذاری…' }: { label?: string }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 10_000); return () => clearTimeout(t) }, [])
  return (
    <div role="status" style={box}>
      <p>{slow ? 'بارگذاری طول کشید. اتصال اینترنت را بررسی کنید.' : label}</p>
      {slow && <button type="button" onClick={reload}>تلاش دوباره</button>}
    </div>
  )
}

interface State { error: Error | null }
export class RouteBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" style={box}>
        <p>بخش موردنظر بارگذاری نشد. ممکن است نسخهٔ جدیدی منتشر شده یا اتصال قطع باشد.</p>
        <button type="button" onClick={reload}>بارگذاری دوباره</button>{' '}
        <a href="/">بازگشت به تقویم</a>
      </div>
    )
  }
}
