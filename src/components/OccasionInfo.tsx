import { getOccasion } from '../data/occasions'
import { MONTHS, WEEKDAYS, faNum, weekdayIndex, type JalaliDate } from '../lib/jalali'

// ارتفاع این بخش ثابت است تا متن مناسبت چیدمان تقویم را جابه‌جا نکند.
export default function OccasionInfo({ selected }: { selected: JalaliDate | null }) {
  const occasion = selected ? getOccasion(selected.month, selected.day) : undefined
  return (
    <div className="cal-info" aria-live="polite">
      {!selected && <p className="info-hint">برای دیدن مناسبت، یک روز را انتخاب کنید</p>}
      {selected && <p className="info-date">{WEEKDAYS[weekdayIndex(selected)]} {faNum(selected.day)} {MONTHS[selected.month - 1]}</p>}
      {occasion && <p className="info-occ">{occasion.title}</p>}
    </div>
  )
}
