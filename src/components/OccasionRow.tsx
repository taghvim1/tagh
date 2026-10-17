import { KIND_LABEL, getOccasion, getOccasionList } from '../lib/calendarData'
import { MONTHS, WEEKDAYS, faNum, formatLongDate, weekdayIndex, type JalaliDate, type MonthRef } from '../lib/jalali'
import CenterModal from './CenterModal'

interface Props {
  view: MonthRef
  selected: JalaliDate
  onPrev: () => void
  onNext: () => void
  /** لمس عنوان مناسبت ⇒ فهرست کامل مناسبت‌های آن روز */
  onOpen?: () => void
}

const Chevron = ({ dir }: { dir: 'right' | 'left' }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'right' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
  </svg>
)

// ردیف ثابت‌ارتفاع بین تاریخ و تقویم: فلش‌های ماه + اطلاعات روز انتخاب‌شده
export default function OccasionRow({ view, selected, onPrev, onNext, onOpen }: Props) {
  const occasion = getOccasion(selected.month, selected.day, selected.year)
  const count = occasion ? 1 + (occasion.more?.length ?? 0) : 0
  const label = occasion ? `${occasion.kind ? KIND_LABEL[occasion.kind] : 'مناسبت'}${count > 1 ? ` · ${faNum(count)} مورد` : ''}` : `${MONTHS[view.month - 1]} ${faNum(view.year)}`
  const title = occasion ? occasion.title : `${WEEKDAYS[weekdayIndex(selected)]} ${faNum(selected.day)} ${MONTHS[selected.month - 1]}`
  const text = (
    <>
      <span className="info-label">{label}</span>
      <strong className={`info-title${title.length > 22 ? ' long' : ''}`}>{title}</strong>
    </>
  )
  return (
    <div className="cal-info">
      <button className="info-nav" onClick={onPrev} aria-label="ماه قبل"><Chevron dir="right" /></button>
      {occasion && onOpen
        ? <button type="button" className="info-text info-btn" onClick={onOpen} aria-haspopup="dialog" aria-label={`${title}${count > 1 ? ` و ${faNum(count - 1)} مناسبت دیگر` : ''} — نمایش جزئیات`}>{text}</button>
        : <div className="info-text" aria-live="polite">{text}</div>}
      <button className="info-nav" onClick={onNext} aria-label="ماه بعد"><Chevron dir="left" /></button>
    </div>
  )
}

/** پنجرهٔ فهرست همهٔ مناسبت‌های روز انتخاب‌شده (عنوان‌های بلند در ردیف بالا کوتاه می‌شوند) */
export function OccasionsPopup({ date, open, onClose }: { date: JalaliDate; open: boolean; onClose: () => void }) {
  const list = getOccasionList(date.month, date.day, date.year)
  return (
    <CenterModal open={open && list.length > 0} onClose={onClose} label="مناسبت‌های این روز">
      <article className="dc oc-pop">
        <header className="dc-head"><span className="fd-kicker">مناسبت‌های این روز</span><h2>{formatLongDate(date)}</h2></header>
        <ul className="oc-list">
          {list.map((o) => <li key={o.title}><span>{o.title}</span><span className="oc-tags">{o.holiday && <em className="oc-hol">تعطیل</em>}<em className="oc-kind">{KIND_LABEL[o.kind]}</em></span></li>)}
        </ul>
      </article>
    </CenterModal>
  )
}
