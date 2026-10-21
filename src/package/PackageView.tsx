import { useEffect, useState, type ReactNode } from 'react'
import { faNum } from '../lib/jalali'
import { imagesOf, type CostItem, type TourPackage } from './types'

/** مبلغ تومانی خوانا: ۱٫۵ میلیون تومان / ۸۰۰ هزار تومان */
export const money = (n: number) => (n >= 1_000_000 ? `${faNum(Math.round(n / 100_000) / 10).replace('.', '٫')} میلیون` : `${faNum(Math.round(n / 1000))} هزار`) + ' تومان'
const range = (a: number, b: number) => (a === b ? money(a) : `${money(a)} تا ${money(b)}`)

/** تصاویر مقصد؛ هر ۱ ثانیه خودکار جابه‌جا می‌شود (با «کاهش حرکت» در سیستم، ثابت می‌ماند). */
function Slides({ pkg }: { pkg: TourPackage }) {
  const imgs = imagesOf(pkg), [i, setI] = useState(0)
  useEffect(() => {
    if (imgs.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setI((x) => (x + 1) % imgs.length), 1000)
    return () => window.clearInterval(t)
  }, [imgs.length])
  if (!imgs.length) return null
  const cur = imgs[i % imgs.length]
  return (
    <figure className="pk-img">
      <div className="pk-slides">
        {imgs.map((m, k) => <img key={m.url} src={m.url} alt={k === i ? `تصویر ${pkg.input.destination}` : ''} aria-hidden={k !== i} className={k === i ? 'on' : ''} loading={k === 0 ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />)}
        {imgs.length > 1 && <div className="pk-dots" aria-hidden="true">{imgs.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>}
      </div>
      {cur.attribution && <figcaption>{cur.source_url ? <a href={cur.source_url} target="_blank" rel="noopener noreferrer">{cur.attribution}</a> : cur.attribution}</figcaption>}
    </figure>
  )
}

function Cost({ c }: { c: TourPackage['content']['cost'] }) {
  if (c.items?.length) {
    return (
      <section className="pk-card">
        <h3>هزینهٔ تقریبی (هر نفر)</h3>
        <ul className="pk-cost">
          {c.items.map((x: CostItem, k) => <li key={k}><span>{x.label}{x.estimated && <em>تخمینی</em>}</span><b>{range(x.min, x.max)}</b></li>)}
          <li className="pk-total"><span>جمع</span><b>{range(c.total_min ?? 0, c.total_max ?? 0)}</b></li>
        </ul>
        {c.note && <p className="pk-small">{c.note}</p>}
      </section>
    )
  }
  return (
    <section className="pk-card"><h3>هزینهٔ تقریبی</h3><p><b>{c.total}</b></p>{c.breakdown?.length ? <ul>{c.breakdown.map((b, k) => <li key={k}>{b}</li>)}</ul> : null}</section>
  )
}

/** نمایش یک پکیج (در پنجرهٔ نتیجه و در علاقه‌مندی‌ها). */
export default function PackageView({ pkg, actions }: { pkg: TourPackage; actions?: ReactNode }) {
  const { content: c, input: i } = pkg
  return (
    <article className="pk-view pk-font">
      <Slides pkg={pkg} />
      <h2 className="pk-title">{c.title}</h2>
      <ul className="pk-meta" aria-label="مشخصات سفر">
        <li>{i.origin} ← {i.destination}</li><li>{faNum(i.days)} روز</li><li>{i.vehicle}</li><li>{i.trip_type}</li><li>بودجه {i.budget}</li>
      </ul>
      {actions}
      <p className="pk-sum">{c.summary}</p>
      <section className="pk-card pk-trans"><h3>مسیر{c.best_season ? ' و زمان سفر' : ''}</h3><p>{c.transport}{c.best_season && <><br />بهترین زمان: {c.best_season}</>}</p></section>
      <section>
        <h3 className="pk-h">برنامهٔ روزها</h3>
        <ol className="pk-days">
          {c.days.map((d) => (
            <li key={d.day}>
              <span className="pk-day-no">{faNum(d.day)}</span>
              <div><strong>{d.title}</strong><ul>{d.plan.map((p, k) => <li key={k}>{p}</li>)}</ul></div>
            </li>
          ))}
        </ol>
      </section>
      <Cost c={c.cost} />
      <section className="pk-card pk-tips"><h3>نکات مهم مقصد</h3><ul>{c.tips.map((t, k) => <li key={k}>{t}</li>)}</ul></section>
      {c.warnings.length > 0 && <section className="pk-card pk-warn"><h3>هشدار</h3><ul>{c.warnings.map((t, k) => <li key={k}>{t}</li>)}</ul></section>}
      {pkg.booking && pkg.booking.length > 0 && (
        <section className="pk-card">
          <h3>رزرو از این سایت‌ها</h3>
          <div className="pk-book">
            {pkg.booking.map((b) => <a key={b.url} href={b.url} target="_blank" rel="noopener noreferrer"><strong>{b.name}</strong><small>{b.note}</small></a>)}
          </div>
        </section>
      )}
      <p className="pk-small">طراحی با هوش مصنوعی؛ قیمت و ساعت‌ها را پیش از سفر بررسی کنید.</p>
    </article>
  )
}
