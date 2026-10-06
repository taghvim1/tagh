import { useState } from 'react'
import AppChrome from '../components/AppChrome'
import { findDestination, locationLabel } from '../data/destinations'
import { BackLink } from '../lib/router'
import { useDarkMode, useThemeColorMeta } from '../lib/theme'

// ذخیرهٔ نمایشی؛ فقط در حافظهٔ همین جلسه (بدون حساب کاربری یا سرور)
const saved = new Set<number>()

export default function DestinationDetails({ id }: { id: number }) {
  const [dark, setDark] = useDarkMode()
  useThemeColorMeta(dark)
  const d = findDestination(id)
  const [isSaved, setIsSaved] = useState(() => saved.has(id))
  const toggle = () => {
    if (saved.has(id)) saved.delete(id)
    else saved.add(id)
    setIsSaved(saved.has(id))
  }

  return (
    <div className="tp-page" data-theme={dark ? 'dark' : 'light'}>
      <AppChrome title="تقویم سفر" dark={dark} onDarkChange={setDark} />
      <main className="tp-main">
        <BackLink fallback="/travel-suggestions" className="tp-back"><span aria-hidden="true">›</span> بازگشت به پیشنهادها</BackLink>
        {!d ? (
          <header className="tp-head"><h1>مقصد پیدا نشد</h1><p className="tp-lead">این مقصد وجود ندارد.</p></header>
        ) : (
          <>
            <img className="dd-hero" src={d.image} alt={d.name} />
            <header className="tp-head">
              <h1>{d.name}</h1>
              <p className="tp-lead">{locationLabel(d)}</p>
            </header>
            <p className="dd-desc">{d.description}</p>

            <dl className="dest-meta dd-meta">
              <div><dt>بهترین زمان سفر</dt><dd>{d.best_seasons.join('، ')}</dd></div>
              <div><dt>مناسب برای</dt><dd>{d.recommended_for.join('، ')}</dd></div>
              <div><dt>میانگین دما (تقریبی)</dt><dd>{d.average_temperature}</dd></div>
              <div><dt>وضعیت آب‌وهوا</dt><dd>{d.weather}</dd></div>
              <div><dt>میزان بارندگی</dt><dd>{d.rainfall}</dd></div>
              <div><dt>مدت پیشنهادی سفر</dt><dd>{d.duration}</dd></div>
              <div><dt>هزینهٔ تقریبی</dt><dd>سطح {d.budget}</dd></div>
              {d.visa_required !== null && <div><dt>نیاز به ویزا</dt><dd>{d.visa_required ? 'بله' : 'خیر'}</dd></div>}
            </dl>
            {d.visa_required !== null && <p className="dd-note">وضعیت ویزا برای شهروندان ایران و نمونه است و ممکن است تغییر کند؛ پیش از سفر از منبع رسمی بررسی کنید.</p>}

            <section className="dd-attractions">
              <h2>جاذبه‌های اصلی</h2>
              <ul>{d.attractions.map((a) => <li key={a}>{a}</li>)}</ul>
            </section>

            <div className="tp-actions">
              <button type="button" className={`tp-btn${isSaved ? ' primary' : ''}`} aria-pressed={isSaved} onClick={toggle}>{isSaved ? 'ذخیره شد' : 'ذخیرهٔ مقصد'}</button>
            </div>
            <p className="dd-note">ذخیره‌سازی فقط نمایشی است و روی حساب کاربری یا سرور ثبت نمی‌شود.</p>
          </>
        )}
      </main>
    </div>
  )
}
