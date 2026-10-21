import type { ReactNode } from 'react'
import { faNum } from '../lib/jalali'
import type { TourPackage } from './types'

/** نمایش یک پکیج (هم در صفحهٔ طراحی و هم در علاقه‌مندی‌ها). */
export default function PackageView({ pkg, actions }: { pkg: TourPackage; actions?: ReactNode }) {
  const { content: c, input: i, image } = pkg
  return (
    <article className="pk-view">
      {image && (
        <figure className="pk-img">
          <img src={image.url} alt={`تصویر ${i.destination}`} loading="lazy" referrerPolicy="no-referrer" />
          {image.attribution && <figcaption>{image.source_url ? <a href={image.source_url} target="_blank" rel="noopener noreferrer">{image.attribution}</a> : image.attribution}</figcaption>}
        </figure>
      )}
      <h2 className="pk-title">{c.title}</h2>
      <ul className="pk-meta" aria-label="مشخصات سفر">
        <li>{i.origin} ← {i.destination}</li><li>{faNum(i.days)} روز</li><li>{i.vehicle}</li><li>{i.trip_type}</li><li>بودجه {i.budget}</li>
      </ul>
      {actions}
      <p className="pk-sum">{c.summary}</p>
      {c.best_season && <p className="pk-note"><strong>بهترین زمان:</strong> {c.best_season}</p>}
      <section><h3>مسیر و رفت‌وآمد</h3><p>{c.transport}</p></section>
      <section>
        <h3>برنامهٔ روزها</h3>
        <ol className="pk-days">
          {c.days.map((d) => (
            <li key={d.day}>
              <strong>روز {faNum(d.day)} — {d.title}</strong>
              <ul>{d.plan.map((p, k) => <li key={k}>{p}</li>)}</ul>
              {d.stay && <p className="pk-small">اقامت: {d.stay}</p>}
              {d.food && <p className="pk-small">غذا: {d.food}</p>}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3>هزینهٔ تقریبی</h3>
        <p><strong>{c.cost.total}</strong></p>
        {c.cost.breakdown.length > 0 && <ul>{c.cost.breakdown.map((b, k) => <li key={k}>{b}</li>)}</ul>}
        <p className="pk-small">قیمت‌ها تقریبی‌اند؛ پیش از رزرو بررسی کنید.</p>
      </section>
      <section className="pk-tips">
        <h3>نکات مهم مقصد</h3>
        <ul>{c.tips.map((t, k) => <li key={k}>{t}</li>)}</ul>
      </section>
      {c.warnings.length > 0 && <section className="pk-warn"><h3>هشدار</h3><ul>{c.warnings.map((t, k) => <li key={k}>{t}</li>)}</ul></section>}
      {pkg.sources.length > 0 && <p className="pk-small">منابع: {pkg.sources.map((s, k) => <span key={s.url}>{k > 0 && '، '}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title.slice(0, 40)}</a></span>)}</p>}
      <p className="pk-small">این پکیج را هوش مصنوعی طراحی کرده است؛ مهم‌ترین موارد (ساعت کاری، قیمت‌ها، شرایط جاده) را پیش از سفر بررسی کنید.</p>
    </article>
  )
}
