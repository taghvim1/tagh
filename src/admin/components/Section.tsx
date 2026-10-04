import type { ReactNode } from 'react'

export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="adm-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
