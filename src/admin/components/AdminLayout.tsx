import { useEffect, useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface Props {
  path: string
  title: string
  children: ReactNode
}

export default function AdminLayout({ path, title, children }: Props) {
  const [open, setOpen] = useState(false)

  // بستن منوی موبایل با تغییر مسیر یا کلید Escape
  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="adm">
      <Sidebar path={path} open={open} onClose={() => setOpen(false)} />
      {open && <button className="adm-backdrop" aria-label="بستن منو" onClick={() => setOpen(false)} />}
      <div className="adm-body">
        <Topbar title={title} menuOpen={open} onMenu={() => setOpen((v) => !v)} />
        <main className="adm-main">{children}</main>
      </div>
    </div>
  )
}
