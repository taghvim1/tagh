import { useEffect, useState } from 'react'
import ChipGroup from '../components/ChipGroup'
import FilterSheet from '../components/FilterSheet'
import { BUDGET_OPTIONS, COMPANION_OPTIONS, DATE_OPTIONS, DIFFICULTY_OPTIONS, DURATION_OPTIONS, EMPTY_TOUR_FILTERS, SCOPE_OPTIONS, SEASON_OPTIONS, TYPE_OPTIONS, type TourFilters } from './logic'

interface Props { open: boolean; onClose: () => void; value: TourFilters; onApply: (f: TourFilters) => void }

export default function TourFilterSheet({ open, onClose, value, onApply }: Props) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { if (open) setDraft(value) }, [open, value])
  const set = (k: keyof TourFilters) => (v: string) => setDraft((d) => ({ ...d, [k]: v }))
  return (
    <FilterSheet open={open} onClose={onClose} title="فیلتر تورها" onApply={() => { onApply(draft); onClose() }} onReset={() => { setDraft(EMPTY_TOUR_FILTERS); onApply(EMPTY_TOUR_FILTERS) }}>
      <ChipGroup label="تاریخ" options={DATE_OPTIONS} value={draft.date} onChange={set('date')} />
      <ChipGroup label="فصل" options={SEASON_OPTIONS} value={draft.season} onChange={set('season')} />
      <ChipGroup label="نوع مقصد" options={SCOPE_OPTIONS} value={draft.scope} onChange={set('scope')} />
      <ChipGroup label="نوع تور" options={TYPE_OPTIONS} value={draft.type} onChange={set('type')} />
      <ChipGroup label="مدت" options={DURATION_OPTIONS} value={draft.duration} onChange={set('duration')} />
      <ChipGroup label="بودجه" options={BUDGET_OPTIONS} value={draft.budget} onChange={set('budget')} />
      <ChipGroup label="سطح سختی" options={DIFFICULTY_OPTIONS} value={draft.difficulty} onChange={set('difficulty')} />
      <ChipGroup label="مناسب برای" options={COMPANION_OPTIONS} value={draft.companion} onChange={set('companion')} />
    </FilterSheet>
  )
}
