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

export function navigate(to: string) {
  if (to === getPath()) return
  window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
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
