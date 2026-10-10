import { useMemo, useState } from 'react'
import CenterModal from '../../components/CenterModal'
import DestinationCard from '../../components/DestinationCard'
import DestinationContent from '../../components/DestinationContent'
import SeasonPicker from '../../components/SeasonPicker'
import type { Destination, Season } from '../../data/destinations'
import { faNum, fromGregorian } from '../../lib/jalali'
import { useOverlay } from '../../lib/overlay'
import { EMPTY_FILTERS } from '../../travel/filters'
import { recommend } from '../../travel/recommend'
import { useDestinations } from '../../travel/repository'
import { seasonOfMonth } from '../../travel/season'
import { useHistoricalClimate } from '../../weather/history/store'

// همان فهرستی که کاربر در «پیشنهاد سفر» می‌بیند، با همان موتور پیشنهاد؛ فقط برای مشاهدهٔ مدیر.
export default function SuggestionsPreview() {
  const all = useDestinations()
  const climate = useHistoricalClimate()
  const [season, setSeason] = useState<Season>(() => seasonOfMonth(fromGregorian(new Date()).month))
  const result = useMemo(() => recommend(all, { season, filters: EMPTY_FILTERS, climate }), [all, season, climate])
  const popup = useOverlay('dest-preview')
  const [openId, setOpenId] = useState<number | null>(null)
  const current = all.find((d) => d.id === openId)
  const open = (d: Destination) => { setOpenId(d.id); popup.show() }
  const section = (title: string, list: Destination[]) => (
    <div className="tp-section"><h3>{title} ({faNum(list.length)})</h3>
      {list.length ? <div className="dest-grid">{list.map((d) => <DestinationCard key={d.id} destination={d} onOpen={open} />)}</div> : <p className="tp-empty">برای {season} مقصد مناسبی نیست.</p>}
    </div>
  )
  return (
    <>
      <div className="adm-page-head"><div><h2>پیش‌نمایش پیشنهاد سفر کاربر</h2>
        <p className="adm-note">دقیقاً همان چیزی که کاربر در هر فصل می‌بیند (فقط مقصدهای فعال و مناسب آن فصل). {faNum(all.filter((d) => d.enabled).length)} مقصد فعال از {faNum(all.length)}.</p></div></div>
      <div className="tp-page" data-theme="light" style={{ minHeight: 0, borderRadius: 14, border: '1px solid #d9dee3' }}>
        <div className="tp-main">
          <SeasonPicker value={season} onChange={setSeason} />
          {section('پیشنهادهای داخلی', result.domestic)}
          {section('پیشنهادهای خارجی', result.international)}
        </div>
        <CenterModal open={popup.open && !!current} onClose={popup.hide} label={current?.name ?? 'جزئیات مقصد'}>
          {current && <DestinationContent destination={current} season={season} />}
        </CenterModal>
      </div>
    </>
  )
}
