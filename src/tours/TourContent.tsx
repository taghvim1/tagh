import FavButton from '../components/FavButton'
import { faNum } from '../lib/jalali'
import type { TourOrganizer } from '../tour-organizers/types'
import { formatDate, formatPrice } from './logic'
import type { Tour } from './types'

const REGISTRATION_OFF = 'ثبت‌نام آنلاین این تور در حال حاضر فعال نیست.'
const list = (title: string, items: string[]) => items.length > 0 && <section className="dc-block"><h3>{title}</h3><ul className="dc-list">{items.map((x) => <li key={x}>{x}</li>)}</ul></section>

// جزئیات کامل تور (صفحهٔ /tours/:id). فقط معرفی تور؛ ثبت‌نام یا پرداخت وجود ندارد.
export default function TourContent({ tour: t, organizer }: { tour: Tour; organizer?: TourOrganizer }) {
  return (
    <article className="dc">
      <FavButton kind="tour" id={t.id} />
      <img className="dc-hero" src={t.image} alt={t.title} />
      <header className="dc-head">
        <h2>{t.title}</h2>
        <p className="dc-loc">{t.destinationName}{organizer ? ` · ${organizer.name}` : ''}</p>
      </header>
      <p className="dc-desc">{t.shortDescription}</p>
      {t.fullDescription && t.fullDescription !== t.shortDescription && <p className="dc-desc">{t.fullDescription}</p>}

      <section className="dc-block">
        <h3>مشخصات تور</h3>
        <dl className="dc-grid">
          <div><dt>مقصد</dt><dd>{t.destinationName}</dd></div>
          <div><dt>تاریخ شروع</dt><dd>{formatDate(t.startDate)}</dd></div>
          <div><dt>تاریخ پایان</dt><dd>{formatDate(t.endDate)}</dd></div>
          <div><dt>مدت</dt><dd>{t.duration}</dd></div>
          <div><dt>قیمت</dt><dd>{formatPrice(t.price)}</dd></div>
          <div><dt>ظرفیت</dt><dd>{faNum(t.capacity)} نفر</dd></div>
          <div><dt>ظرفیت باقی‌مانده</dt><dd>{t.remainingCapacity > 0 ? `${faNum(t.remainingCapacity)} نفر` : 'تکمیل'}</dd></div>
          <div><dt>نوع تور</dt><dd>{t.tourType}</dd></div>
          <div><dt>سبک سفر</dt><dd>{t.travelStyle}</dd></div>
          <div><dt>سطح سختی</dt><dd>{t.difficulty}</dd></div>
          {t.suitableFor.length > 0 && <div><dt>مناسب برای</dt><dd>{t.suitableFor.join('، ')}</dd></div>}
          {t.meetingPoint && <div><dt>محل حضور</dt><dd>{t.meetingPoint}</dd></div>}
          {t.guideName && <div><dt>راهنما</dt><dd>{t.guideName}</dd></div>}
        </dl>
      </section>

      {organizer && (
        <section className="dc-block">
          <h3>برگزارکننده</h3>
          <p className="dc-desc"><strong>{organizer.name}</strong>{organizer.city ? `، ${organizer.city}` : ''}</p>
          {organizer.description && <p className="dc-note">{organizer.description}</p>}
          <dl className="dc-grid">
            {organizer.phone && <div><dt>تلفن</dt><dd dir="ltr">{organizer.phone}</dd></div>}
            {organizer.website && <div><dt>وب‌سایت</dt><dd dir="ltr">{organizer.website}</dd></div>}
            {organizer.instagram && <div><dt>اینستاگرام</dt><dd dir="ltr">{organizer.instagram}</dd></div>}
          </dl>
        </section>
      )}

      {list('برنامهٔ سفر', t.itinerary)}
      {list('خدمات', t.services)}
      {list('شرایط', t.conditions)}

      <section className="dc-block">
        <h3>تماس و ثبت‌نام</h3>
        <dl className="dc-grid">
          {t.contact && <div><dt>تماس</dt><dd dir="auto">{t.contact}</dd></div>}
          {t.registrationLink && <div><dt>لینک ثبت‌نام</dt><dd dir="ltr">{t.registrationLink}</dd></div>}
          <div><dt>وضعیت ثبت‌نام</dt><dd>{t.remainingCapacity === 0 ? 'ظرفیت تکمیل است' : REGISTRATION_OFF}</dd></div>
        </dl>
      </section>
    </article>
  )
}
