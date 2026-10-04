import { useEffect, useRef, useState } from 'react'
import Section from '../components/Section'

// تنظیمات فقط نمایشی‌اند: با Refresh به مقدار اولیه برمی‌گردند.
const INITIAL = { siteName: 'تقویم سفر', showEvents: true, showHolidays: false }

function Switch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="adm-switch-row">
      <span className="adm-switch-text">
        <strong>{label}</strong>
        <span className="adm-note">{description}</span>
      </span>
      <input type="checkbox" role="switch" className="adm-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(INITIAL)
  const [saved, setSaved] = useState(false)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const update = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => setSettings((s) => ({ ...s, [key]: value }))

  const save = () => {
    setSaved(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>تنظیمات</h2>
          <p className="adm-note">مدیریت تنظیمات عمومی تقویم و سامانه</p>
        </div>
      </div>

      <div className="adm-settings">
        <Section title="تنظیمات عمومی">
          <div className="adm-card adm-settings-card">
            <div className="adm-form">
              <label>
                نام سامانه
                <input value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} />
              </label>
            </div>

            <Switch label="نمایش مناسبت‌ها" description="مناسبت‌ها در تقویم نمایش داده شوند." checked={settings.showEvents} onChange={(v) => update('showEvents', v)} />
            <Switch label="نمایش تعطیلات" description="روزهای تعطیل در تقویم مشخص شوند." checked={settings.showHolidays} onChange={(v) => update('showHolidays', v)} />

            <div className="adm-save-row">
              <button className="adm-btn primary" onClick={save}>ذخیره تغییرات</button>
              <span className="adm-saved" role="status">{saved ? 'تغییرات ذخیره شد (نمایشی).' : ''}</span>
            </div>
            <p className="adm-note adm-demo-note">این تنظیمات فعلاً نمایشی‌اند و پس از Refresh ذخیره نمی‌مانند.</p>
          </div>
        </Section>

        <Section title="اطلاعات سامانه">
          <dl className="adm-card adm-info">
            <div><dt>نسخه</dt><dd>۱٫۰٫۰</dd></div>
          </dl>
        </Section>
      </div>
    </>
  )
}
