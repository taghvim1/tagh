import { useEffect, useState } from 'react'
import type { Season } from '../data/destinations'
import { BUDGET_OPTIONS, COMPANION_OPTIONS, DURATION_OPTIONS, EMPTY_FILTERS, RAINFALL_OPTIONS, SCOPE_OPTIONS, SUITABILITY_OPTIONS, TEMPERATURE_OPTIONS, TYPE_OPTIONS, VISA_OPTIONS, type TravelFilters } from '../travel/filters'
import { SEASONS } from '../travel/season'
import ChipGroup from './ChipGroup'
import FilterSheet from './FilterSheet'

interface Props {
  open: boolean
  onClose: () => void
  value: TravelFilters
  season: Season
  /** پیش‌فرض فصل (از تقویم/فصل جاری) برای «پاک کردن» */
  defaultSeason: Season
  onApply: (filters: TravelFilters, season: Season) => void
}

// فیلتر پیشرفته؛ فصل انتخاب‌شده همچنان معیار اصلی است و همهٔ فیلترها روی همان فصل اعمال می‌شوند.
export default function AdvancedFilter({ open, onClose, value, season, defaultSeason, onApply }: Props) {
  const [draft, setDraft] = useState(value)
  const [draftSeason, setDraftSeason] = useState(season)
  useEffect(() => { if (open) { setDraft(value); setDraftSeason(season) } }, [open, value, season])
  const set = <K extends keyof TravelFilters>(key: K, v: TravelFilters[K]) => setDraft((d) => ({ ...d, [key]: v }))

  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      title="فیلتر پیشرفته"
      onApply={() => { onApply(draft, draftSeason); onClose() }}
      onReset={() => { setDraft(EMPTY_FILTERS); setDraftSeason(defaultSeason); onApply(EMPTY_FILTERS, defaultSeason) }}
    >
      <label className="tp-field">
        <span className="tp-label">جستجو</span>
        <input className="tp-input" type="search" value={draft.query} onChange={(e) => set('query', e.target.value)} placeholder="جستجوی شهر، کشور یا مقصد..." />
      </label>
      <ChipGroup label="فصل" options={SEASONS.map((s) => s.title)} value={draftSeason} onChange={(v) => setDraftSeason(v as Season)} />
      <ChipGroup label="نوع مقصد" options={SCOPE_OPTIONS} value={draft.scope} onChange={(v) => set('scope', v)} />
      <ChipGroup label="بودجه" options={BUDGET_OPTIONS} value={draft.budget} onChange={(v) => set('budget', v)} />
      <ChipGroup label="نوع سفر" options={TYPE_OPTIONS} value={draft.type} onChange={(v) => set('type', v)} />
      <ChipGroup label="مدت سفر" options={DURATION_OPTIONS} value={draft.duration} onChange={(v) => set('duration', v)} />
      <ChipGroup label="مناسب برای" options={COMPANION_OPTIONS} value={draft.companion} onChange={(v) => set('companion', v)} />
      <ChipGroup label="تناسب آب‌وهوا" options={SUITABILITY_OPTIONS} value={draft.suitability} onChange={(v) => set('suitability', v)} />
      <ChipGroup label="دما" options={TEMPERATURE_OPTIONS} value={draft.temperature} onChange={(v) => set('temperature', v)} />
      <ChipGroup label="بارندگی" options={RAINFALL_OPTIONS} value={draft.rainfall} onChange={(v) => set('rainfall', v)} />
      <ChipGroup label="ویزا" options={VISA_OPTIONS} value={draft.visa} onChange={(v) => set('visa', v)} />
    </FilterSheet>
  )
}
