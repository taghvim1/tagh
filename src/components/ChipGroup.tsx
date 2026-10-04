import { useId } from 'react'

interface Props {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

// انتخاب تکی؛ کلیک دوباره روی گزینهٔ انتخاب‌شده آن را برمی‌دارد.
export default function ChipGroup({ label, options, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="tp-field">
      <span id={id} className="tp-label">{label}</span>
      <div className="tp-chips" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button key={o} type="button" className={`tp-chip${o === value ? ' on' : ''}`} aria-pressed={o === value} onClick={() => onChange(o === value ? '' : o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
