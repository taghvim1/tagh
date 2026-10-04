// آیکون‌های ساده و درون‌خطی (بدون کتابخانه). تزئینی‌اند؛ متن کنارشان معنا را می‌رساند.
const PATHS = {
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  event: 'm12 3 2.7 5.6 6.1.8-4.4 4.2 1.1 6-5.5-3-5.5 3 1.1-6L3.2 9.4l6.1-.8L12 3Z',
  mobile: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  system: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.5l2.7 2.7L16 9.8',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name }: { name: IconName }) {
  return (
    <svg className="adm-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  )
}
