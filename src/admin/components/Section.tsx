import type { ReactNode } from 'react'

interface Props {
  title: string
  /** توضیح کوتاه زیر عنوان بخش (اختیاری) */
  desc?: string
  children: ReactNode
}

export default function Section({ title, desc, children }: Props) {
  return (
    <section className="adm-section">
      <div className="adm-section-head">
        <h2>{title}</h2>
        {desc && <p className="adm-section-desc">{desc}</p>}
      </div>
      {children}
    </section>
  )
}
