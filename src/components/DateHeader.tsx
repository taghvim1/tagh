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
      <h1 className="dh-main">{faNum(j.day)} {WEEKDAYS[weekdayIndex(j)]} {MONTHS[j.month - 1]}</h1>
      <p className="dh-sub">{formatIn(today, 'gregory')}</p>
      <p className="dh-sub">{formatIn(today, 'islamic-umalqura')}</p>
    </header>
  )
}
