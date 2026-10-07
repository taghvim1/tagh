import { useState } from 'react'
import { LEVEL_LABEL, RATING_LABEL, withDerived, type Destination, type Level, type Rating, type SeasonClimate } from '../../data/destinations'
import { destinationRepo, useDestinations } from '../../travel/repository'
import { SEASONS } from '../../travel/season'

// پیشنهادهای فصلی: مدیر برای هر مقصد در هر فصل تناسب، اولویت و پارامترهای هوا را تعیین می‌کند (ذخیرهٔ فوری).
export default function SeasonalRecommendations() {
  const all = useDestinations()
  const [season, setSeason] = useState(SEASONS[0])

  const update = (d: Destination, patch: Partial<SeasonClimate>) => {
    const cur = d.season_suitability[season.id]
    const next = { ...cur, ...patch }
    // میانگین باید بین حداقل و حداکثر بماند
    next.temperature_min = Math.min(next.temperature_min, next.average_temperature)
    next.temperature_max = Math.max(next.temperature_max, next.average_temperature)
    destinationRepo.upsert(withDerived({ ...d, season_suitability: { ...d.season_suitability, [season.id]: next } }))
  }
  const numField = (d: Destination, key: 'average_temperature' | 'priority') => (
    <input type="number" defaultValue={d.season_suitability[season.id][key]} key={`${d.id}${season.id}${key}${d.season_suitability[season.id][key]}`}
      onBlur={(e) => { const v = e.target.value.trim(); if (v !== '' && !Number.isNaN(Number(v))) update(d, { [key]: Number(v) }) }} aria-label={key === 'priority' ? 'اولویت' : 'میانگین دما'} />
  )
  const text = (d: Destination, key: 'weather_condition' | 'description') => (
    <input type="text" defaultValue={d.season_suitability[season.id][key]} key={`${d.id}${season.id}${key}${d.season_suitability[season.id][key]}`}
      onBlur={(e) => update(d, { [key]: e.target.value.trim() })} aria-label={key === 'description' ? 'توضیح فصل' : 'وضعیت هوا'} />
  )

  return (
    <>
      <div className="adm-page-head">
        <div><h2>پیشنهادهای فصلی</h2><p className="adm-note">تعیین کنید هر مقصد در فصل انتخاب‌شده چقدر مناسب است؛ تغییرات بلافاصله در پیشنهاد سفر اعمال می‌شود.</p></div>
      </div>
      <div className="adm-seasons" role="tablist" aria-label="فصل">
        {SEASONS.map((s) => <button key={s.id} role="tab" aria-selected={s.id === season.id} className={`adm-btn${s.id === season.id ? ' primary' : ''}`} onClick={() => setSeason(s)}>{s.title}</button>)}
      </div>
      <div className="adm-table-wrap scroll">
        <table className="adm-table adm-seasonal">
          <thead><tr><th>مقصد</th><th>تناسب</th><th>اولویت</th><th>میانگین دما</th><th>بارندگی</th><th>وضعیت هوا</th><th>توضیح فصل</th></tr></thead>
          <tbody>
            {all.map((d) => {
              const c = d.season_suitability[season.id]
              return (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td><select value={c.rating} aria-label="تناسب" onChange={(e) => update(d, { rating: e.target.value as Rating })}>{(Object.keys(RATING_LABEL) as Rating[]).map((k) => <option key={k} value={k}>{RATING_LABEL[k]}</option>)}</select></td>
                  <td>{numField(d, 'priority')}</td>
                  <td>{numField(d, 'average_temperature')}</td>
                  <td><select value={c.rainfall} aria-label="بارندگی" onChange={(e) => update(d, { rainfall: e.target.value as Level })}>{(Object.keys(LEVEL_LABEL) as Level[]).map((k) => <option key={k} value={k}>{LEVEL_LABEL[k]}</option>)}</select></td>
                  <td>{text(d, 'weather_condition')}</td>
                  <td>{text(d, 'description')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
