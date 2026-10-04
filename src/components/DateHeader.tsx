import { MONTHS, WEEKDAYS, faNum, fromGregorian, weekdayIndex } from '../lib/jalali'

function formatIn(date: Date, calendar: 'gregory' | 'islamic-umalqura') {
  const parts = new Intl.DateTimeFormat(`fa-IR-u-ca-${calendar}`, { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')}`
}

export default function DateHeader({ today }: { today: Date }) {
  const j = fromGregorian(today)
  return (
    <header className="dh">
      <div className="dh-main">
        <h1 className="dh-day" aria-label={`امروز ${faNum(j.day)} ${MONTHS[j.month - 1]}`}>{faNum(j.day)}</h1>
        <div className="dh-text">
          <span className="dh-weekday">{WEEKDAYS[weekdayIndex(j)]}</span>
          <span className="dh-month">{MONTHS[j.month - 1]} {faNum(j.year)}</span>
        </div>
      </div>
      <div className="dh-other">
        <span><span className="dh-tag">میلادی</span> {formatIn(today, 'gregory')}</span>
        <span><span className="dh-tag">قمری</span> {formatIn(today, 'islamic-umalqura')}</span>
      </div>
    </header>
  )
}
