// روتر سبک مبتنی بر History API (فقط برای چند مسیر؛ بدون وابستگی جدید)
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

const NAVIGATE_EVENT = 'app:navigate'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener(NAVIGATE_EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(NAVIGATE_EVENT, callback)
  }
}

const getPath = () => window.location.pathname.replace(/\/+$/, '') || '/'

export const usePath = () => useSyncExternalStore(subscribe, getPath, () => '/')

interface HistoryState { inApp?: boolean; idx?: number; overlay?: string }
const current = () => (window.history.state ?? {}) as HistoryState

/** هر صفحهٔ داخلی یک ورودی History دارد؛ idx عمق در برنامه است (۰ = صفحهٔ اصلی). */
export function navigate(to: string) {
  if (to === getPath()) return
  const state = current()
  const next: HistoryState = { inApp: true, idx: (state.idx ?? 0) + 1 }
  // اگر منو/اعلان باز است، ورودی همان Overlay جایگزین می‌شود تا پس از Back به آن برنگردیم
  if (state.overlay) window.history.replaceState(next, '', to)
  else window.history.pushState(next, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
}

/** برگشت به صفحهٔ قبلی برنامه؛ اگر صفحهٔ قبلی نباشد به fallback می‌رود (هرگز مستقیم خروج نمی‌دهد) */
export function goBack(fallback: string) {
  if ((current().idx ?? 0) > 0) window.history.back()
  else navigate(fallback)
}

/**
 * یک‌بار هنگام شروع: اگر برنامه مستقیم روی صفحهٔ داخلی باز شده باشد، صفحهٔ اصلی را زیر آن می‌گذارد
 * تا Back به‌جای خروج از برنامه به صفحهٔ اصلی برگردد.
 */
export function initHistory() {
  const h = window.history
  const state = current()
  if (state.inApp) {
    if (state.overlay) h.replaceState({ inApp: true, idx: state.idx ?? 0 }, '') // Overlay بعد از Reload بسته است
    return
  }
  const here = window.location.pathname + window.location.search + window.location.hash
  if (getPath() === '/') {
    h.replaceState({ inApp: true, idx: 0 }, '')
  } else {
    h.replaceState({ inApp: true, idx: 0 }, '', '/')
    h.pushState({ inApp: true, idx: 1 }, '', here)
  }
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={handleClick} {...rest} />
}

/** لینک «بازگشت» که از History استفاده می‌کند و صفحه‌های تکراری روی هم نمی‌ریزد */
export function BackLink({ fallback, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { fallback: string }) {
  return <a href={fallback} onClick={(e) => { e.preventDefault(); goBack(fallback) }} {...rest} />
}
