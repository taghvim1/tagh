import { useState } from 'react'
import { MONTHS, WEEKDAYS, faNum, firstWeekday, monthLength, toJalali } from './jalali'

export default function App() {
  const today = toJalali(new Date())
  const [view, setView] = useState({ jy: today.jy, jm: today.jm })

  const go = (delta: number) =>
    setView(({ jy, jm }) => {
      const idx = jy * 12 + (jm - 1) + delta
      return { jy: Math.floor(idx / 12), jm: (idx % 12) + 1 }
    })

  const offset = firstWeekday(view.jy, view.jm)
  const days = monthLength(view.jy, view.jm)
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  const isTodayMonth = view.jy === today.jy && view.jm === today.jm

  return (
    <main className="app">
      <header className="head">
        <div className="title">
          <h1>{MONTHS[view.jm - 1]}</h1>
          <span className="year">{faNum(view.jy)}</span>
        </div>
        <nav className="nav" aria-label="پیمایش ماه">
          <button onClick={() => go(-1)} aria-label="ماه قبل">›</button>
          <button className="today" onClick={() => setView({ jy: today.jy, jm: today.jm })} disabled={isTodayMonth}>
            امروز
          </button>
          <button onClick={() => go(1)} aria-label="ماه بعد">‹</button>
        </nav>
      </header>

      <div className="grid weekdays" role="row">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={i === 6 ? 'off' : ''} title={w}>
            <span className="full">{w}</span>
            <span className="short">{w[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid days">
        {cells.map((d, i) =>
          d === null ? (
            <div key={i} className="cell empty" />
          ) : (
            <div
              key={i}
              className={`cell${i % 7 === 6 ? ' off' : ''}${isTodayMonth && d === today.jd ? ' now' : ''}`}
              aria-current={isTodayMonth && d === today.jd ? 'date' : undefined}
            >
              {faNum(d)}
            </div>
          )
        )}
      </div>
    </main>
  )
}
