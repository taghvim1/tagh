import { getOccasion } from '../data/occasions'
import { MONTHS, WEEKDAYS, faNum, weekdayIndex, type JalaliDate, type MonthRef } from '../lib/jalali'

interface Props {
  view: MonthRef
  selected: JalaliDate
  onPrev: () => void
  onNext: () => void
}

const Chevron = ({ dir }: { dir: 'right' | 'left' }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'right' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
  </svg>
)

// ردیف ثابت‌ارتفاع بین تاریخ و تقویم: فلش‌های ماه + اطلاعات روز انتخاب‌شده
export default function OccasionRow({ view, selected, onPrev, onNext }: Props) {
  const occasion = getOccasion(selected.month, selected.day)
  const label = occasion ? (occasion.hypothetical ? 'مناسبت فرضی' : 'مناسبت') : `${MONTHS[view.month - 1]} ${faNum(view.year)}`
  const title = occasion ? occasion.title : `${WEEKDAYS[weekdayIndex(selected)]} ${faNum(selected.day)} ${MONTHS[selected.month - 1]}`
  return (
    <div className="cal-info">
      <button className="info-nav" onClick={onPrev} aria-label="ماه قبل"><Chevron dir="right" /></button>
      <div className="info-text" aria-live="polite">
        <span className="info-label">{label}</span>
        <strong className="info-title">{title}</strong>
      </div>
      <button className="info-nav" onClick={onNext} aria-label="ماه بعد"><Chevron dir="left" /></button>
    </div>
  )
}
