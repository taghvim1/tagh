import type { ReactNode } from 'react'

// فیلدهای کوچک فرم‌های مدیریتی (داخل <form className="adm-form">)
type Opt = string | [value: string, label: string]
const val = (o: Opt) => (typeof o === 'string' ? o : o[0])
const lab = (o: Opt) => (typeof o === 'string' ? o : o[1])

export const TextField = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <label>{label}<input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>
)

export const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly Opt[] }) => (
  <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={val(o)} value={val(o)}>{lab(o)}</option>)}</select></label>
)

export const AreaField = ({ label, value, onChange, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) => (
  <label>{label}{hint && <span className="adm-note">{hint}</span>}<textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>
)

export const CheckGroup = ({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) => (
  <fieldset className="adm-checks">
    <legend>{label}</legend>
    {options.map((o) => (
      <label key={o} className="adm-check">
        <input type="checkbox" checked={value.includes(o)} onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))} />
        {o}
      </label>
    ))}
  </fieldset>
)

export const Row = ({ children }: { children: ReactNode }) => <div className="adm-form-row">{children}</div>

export const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)
export const num = (s: string) => (s.trim() === '' ? NaN : Number(s))
