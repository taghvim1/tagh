import { useEffect, useState } from 'react'
import type { Season } from '../data/destinations'
import { BUDGET_OPTIONS, COMPANION_OPTIONS, DURATION_OPTIONS, EMPTY_FILTERS, SCOPE_OPTIONS, TYPE_OPTIONS, VISA_OPTIONS, type TravelFilters } from '../travel/filters'
import ChipGroup from './ChipGroup'

interface Props {
  open: boolean
  onClose: () => void
  value: TravelFilters
  onApply: (filters: TravelFilters) => void
  season: Season
}

// پنل فیلتر پیشرفته؛ فقط با باز شدن در DOM وجود دارد. تغییرات با «اعمال فیلترها» ثبت می‌شوند.
export default function AdvancedFilter({ open, onClose, value, onApply, season }: Props) {
  const [draft, setDraft] = useState(value)
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => { if (open) setDraft(value) }, [open, value])

  // نصب/حذف از DOM با فاصلهٔ انیمیشن
  useEffect(() => {
    if (open) {
      setMounted(true)
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(r)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), 280)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null
  const set = <K extends keyof TravelFilters>(key: K, v: TravelFilters[K]) => setDraft((d) => ({ ...d, [key]: v }))

  return (
    <>
      <button className={`af-backdrop${shown ? ' open' : ''}`} aria-label="بستن فیلتر" tabIndex={-1} onClick={onClose} />
      <section className={`af${shown ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="فیلتر پیشرفته">
        <div className="af-head">
          <h2>فیلتر پیشرفته</h2>
          <button type="button" className="af-close" aria-label="بستن" onClick={onClose}>×</button>
        </div>
        <div className="af-body">
          <p className="af-season">فصل انتخاب‌شده: <strong>{season}</strong> (فیلترها روی همین فصل اعمال می‌شوند)</p>
          <label className="tp-field">
            <span className="tp-label">جستجو</span>
            <input className="tp-input" type="search" value={draft.query} onChange={(e) => set('query', e.target.value)} placeholder="جستجوی شهر یا کشور" />
          </label>
          <ChipGroup label="نوع مقصد" options={SCOPE_OPTIONS} value={draft.scope} onChange={(v) => set('scope', v)} />
          <ChipGroup label="بودجه" options={BUDGET_OPTIONS} value={draft.budget} onChange={(v) => set('budget', v)} />
          <ChipGroup label="نوع سفر" options={TYPE_OPTIONS} value={draft.type} onChange={(v) => set('type', v)} />
          <ChipGroup label="مدت سفر" options={DURATION_OPTIONS} value={draft.duration} onChange={(v) => set('duration', v)} />
          <ChipGroup label="مناسب برای" options={COMPANION_OPTIONS} value={draft.companion} onChange={(v) => set('companion', v)} />
          <ChipGroup label="ویزا" options={VISA_OPTIONS} value={draft.visa} onChange={(v) => set('visa', v)} />
        </div>
        <div className="af-foot">
          <button type="button" className="tp-btn primary" onClick={() => { onApply(draft); onClose() }}>اعمال فیلترها</button>
          <button type="button" className="tp-btn" onClick={() => { setDraft(EMPTY_FILTERS); onApply(EMPTY_FILTERS) }}>پاک کردن فیلترها</button>
        </div>
      </section>
    </>
  )
}
