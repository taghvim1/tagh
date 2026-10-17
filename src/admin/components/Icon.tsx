// آیکون‌های ساده و درون‌خطی (بدون کتابخانه). تزئینی‌اند؛ متن کنارشان معنا را می‌رساند.
const PATHS = {
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  event: 'm12 3 2.7 5.6 6.1.8-4.4 4.2 1.1 6-5.5-3-5.5 3 1.1-6L3.2 9.4l6.1-.8L12 3Z',
  mobile: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  system: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.5l2.7 2.7L16 9.8',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z',
  pin: 'M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  spark: 'M11 4l1.7 4.6L17.3 10.3l-4.6 1.7L11 16.6 9.3 12 4.7 10.3 9.3 8.6 11 4ZM18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1-2.1-.9 2.1-.9L18 14Z',
  leaf: 'M20 4c-9 .5-13.5 5-13.5 11.5 0 1.2.2 2.3.6 3.5 8.4-.6 13.4-6.4 12.9-15ZM5 20c2.2-6 6.2-10.6 11.5-13.5',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.7-3.2 3.3-5 6.5-5s5.8 1.8 6.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15.2c2 .7 3.4 2.3 4 4.8',
  ticket: 'M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6ZM14 5v14',
  bulb: 'M9 21h6M10 17.5h4M12 3a6 6 0 0 0-3.7 10.7c.7.6 1.2 1.4 1.4 2.3h4.6c.2-.9.7-1.7 1.4-2.3A6 6 0 0 0 12 3Z',
  news: 'M16 4H5a1 1 0 0 0-1 1v12a2.5 2.5 0 0 0 2.5 2.5H18a2.5 2.5 0 0 0 2.5-2.5V8H16V4ZM16 4h2.5A2.5 2.5 0 0 1 21 6.5V8h-5M7.5 8.5H13M7.5 12h8.5M7.5 15.5H13',
  key: 'M14.5 3a6.5 6.5 0 0 0-6.2 8.4L3 16.7V21h4.3l1.2-1.2v-2h2l1.3-1.3.5-2A6.5 6.5 0 1 0 14.5 3ZM16.5 7.5h.01',
  chart: 'M4 20h16M7 16v-5M12 16V7M17 16v-8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  check: 'M5 12.5 10 17.5 19 7',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="adm-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
